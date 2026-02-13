import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateRegistrySuggestions, RegistrySuggestion } from '@/lib/openai';
import { z } from 'zod';
import {
  AppError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/lib/errors';

// ============================================================================
// TYPES
// ============================================================================

export interface RegistryRecommendationItem {
  productId: string | null;
  productName: string;
  category: string;
  priority: 'essential' | 'recommended' | 'nice-to-have';
  quantity: number;
  reasoning: string;
  matchScore: number;
  product?: {
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    compareAtPrice: number | null;
    images: Array<{ url: string; altText: string | null }>;
    inStock: boolean;
  };
}

export interface RegistryRecommendationsResponse {
  recommendations: RegistryRecommendationItem[];
  basedOn: {
    dueDate: string | null;
    babyGender: string | null;
    existingItemCount: number;
  };
}

// ============================================================================
// GET /api/recommendations/registry/[registryId] - Get AI-powered registry suggestions
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ registryId: string }> }
) {
  try {
    const { registryId } = await params;
    const user = await getCurrentUser();

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    // Get registry
    const registry = await prisma.registry.findUnique({
      where: { id: registryId },
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
          },
        },
        growthEntries: {
          select: {
            childBirthDate: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Check ownership
    if (registry.userId !== user.id) {
      throw new ForbiddenError('You do not have permission to view these recommendations');
    }

    // Get existing items for context
    const existingItems = registry.items.map((item) => item.productName);

    // Determine baby gender from registry metadata or growth entries
    // For now, we'll use placeholder logic - in production, this would come from user profile
    const babyGender = 'neutral' as 'male' | 'female' | 'neutral';

    // Calculate due date or use event date
    const dueDate = registry.eventDate?.toISOString() || null;

    // Get AI suggestions
    let aiSuggestions: RegistrySuggestion[] = [];
    try {
      aiSuggestions = await generateRegistrySuggestions({
        dueDate,
        babyGender,
        budget: 'medium',
        existingItems,
      });
    } catch (aiError) {
      console.error('AI registry suggestions failed:', aiError);
      // Fall back to default suggestions
      aiSuggestions = getDefaultSuggestions();
    }

    // Try to match AI suggestions with actual products
    const productNames = aiSuggestions.map((s) => s.productName.toLowerCase());
    
    // Search for matching products
    const matchingProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { in: productNames, mode: 'insensitive' } },
          { category: { name: { in: aiSuggestions.map((s) => s.category), mode: 'insensitive' } } },
        ],
      },
      take: 50,
      include: {
        images: {
          where: { isPrimary: true },
          select: { url: true, altText: true },
          take: 1,
        },
        category: {
          select: { name: true },
        },
        variants: {
          where: { isActive: true },
          include: {
            inventory: {
              select: { available: true },
            },
          },
        },
      },
    });

    // Create a map for quick product lookup by name similarity
    const productMap = new Map<string, typeof matchingProducts[0]>();
    for (const product of matchingProducts) {
      const normalizedName = product.name.toLowerCase();
      for (const suggestion of aiSuggestions) {
        if (normalizedName.includes(suggestion.productName.toLowerCase()) ||
            suggestion.productName.toLowerCase().includes(normalizedName)) {
          if (!productMap.has(suggestion.productName)) {
            productMap.set(suggestion.productName, product);
          }
        }
      }
    }

    // Build recommendations with matched products
    const recommendations: RegistryRecommendationItem[] = aiSuggestions.map((suggestion) => {
      const matchedProduct = productMap.get(suggestion.productName);
      
      return {
        productId: matchedProduct?.id || null,
        productName: suggestion.productName,
        category: suggestion.category,
        priority: suggestion.priority,
        quantity: suggestion.quantity,
        reasoning: suggestion.reasoning,
        matchScore: matchedProduct ? 0.9 : 0.5,
        product: matchedProduct
          ? {
              id: matchedProduct.id,
              name: matchedProduct.name,
              slug: matchedProduct.slug,
              basePrice: matchedProduct.basePrice.toNumber(),
              compareAtPrice: matchedProduct.compareAtPrice?.toNumber() || null,
              images: matchedProduct.images,
              inStock: matchedProduct.variants.some(
                (v) => (v.inventory?.available || 0) > 0
              ),
            }
          : undefined,
      };
    });

    // Sort by priority and match score
    const priorityOrder = { essential: 0, recommended: 1, 'nice-to-have': 2 };
    recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.matchScore - a.matchScore;
    });

    const response: RegistryRecommendationsResponse = {
      recommendations: recommendations.slice(0, 15),
      basedOn: {
        dueDate,
        babyGender,
        existingItemCount: existingItems.length,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error('Error fetching registry recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDefaultSuggestions(): RegistrySuggestion[] {
  return [
    {
      productId: '',
      productName: 'Baby Monitor',
      category: 'Safety',
      priority: 'essential',
      quantity: 1,
      reasoning: 'Essential for keeping an eye on your baby while they sleep',
    },
    {
      productId: '',
      productName: 'Diapers',
      category: 'Essentials',
      priority: 'essential',
      quantity: 10,
      reasoning: 'You can never have too many diapers in the early months',
    },
    {
      productId: '',
      productName: 'Baby Clothes Set',
      category: 'Clothing',
      priority: 'essential',
      quantity: 5,
      reasoning: 'Essential onesies and sleepers for everyday wear',
    },
    {
      productId: '',
      productName: 'Baby Carrier',
      category: 'Gear',
      priority: 'recommended',
      quantity: 1,
      reasoning: 'Great for keeping baby close while having hands free',
    },
    {
      productId: '',
      productName: 'Baby Bath Tub',
      category: 'Bath',
      priority: 'recommended',
      quantity: 1,
      reasoning: 'Safe and comfortable bathing for newborns',
    },
    {
      productId: '',
      productName: 'Swaddle Blankets',
      category: 'Bedding',
      priority: 'essential',
      quantity: 4,
      reasoning: 'Helps babies sleep better by recreating the womb environment',
    },
    {
      productId: '',
      productName: 'Baby Bottles Set',
      category: 'Feeding',
      priority: 'recommended',
      quantity: 1,
      reasoning: 'Essential for feeding whether breastfeeding or formula',
    },
    {
      productId: '',
      productName: 'Changing Pad',
      category: 'Nursery',
      priority: 'essential',
      quantity: 1,
      reasoning: 'Safe and comfortable surface for diaper changes',
    },
    {
      productId: '',
      productName: 'Baby Stroller',
      category: 'Gear',
      priority: 'essential',
      quantity: 1,
      reasoning: 'Essential for getting around with your baby',
    },
    {
      productId: '',
      productName: 'Car Seat',
      category: 'Safety',
      priority: 'essential',
      quantity: 1,
      reasoning: 'Required by law for bringing baby home from hospital',
    },
  ];
}
