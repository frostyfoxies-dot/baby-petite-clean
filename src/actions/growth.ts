'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/errors';
import OpenAI from 'openai';

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Result type for server actions
 */
export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Add growth entry input schema
 */
const addGrowthEntrySchema = z.object({
  childName: z.string().min(1, 'Child name is required').max(100).optional(),
  childBirthDate: z.string().datetime().optional().nullable(),
  height: z.number().positive('Height must be positive').optional().nullable(),
  weight: z.number().positive('Weight must be positive').optional().nullable(),
  headCircumference: z.number().positive('Head circumference must be positive').optional().nullable(),
  notes: z.string().max(500).optional(),
});

export type AddGrowthEntryInput = z.infer<typeof addGrowthEntrySchema>;

/**
 * Update growth entry input schema
 */
const updateGrowthEntrySchema = z.object({
  entryId: z.string().cuid('Invalid entry ID'),
  height: z.number().positive('Height must be positive').optional().nullable(),
  weight: z.number().positive('Weight must be positive').optional().nullable(),
  headCircumference: z.number().positive('Head circumference must be positive').optional().nullable(),
  notes: z.string().max(500).optional(),
});

export type UpdateGrowthEntryInput = z.infer<typeof updateGrowthEntrySchema>;

/**
 * Delete growth entry input schema
 */
const deleteGrowthEntrySchema = z.object({
  entryId: z.string().cuid('Invalid entry ID'),
});

export type DeleteGrowthEntryInput = z.infer<typeof deleteGrowthEntrySchema>;

/**
 * Size prediction result
 */
export interface SizePrediction {
  currentSize: {
    clothing: string;
    shoes: string;
    diaper: string;
  };
  predictedSizes: Array<{
    ageMonths: number;
    clothing: string;
    shoes: string;
    diaper: string;
    height: number;
    weight: number;
  }>;
  growthPercentile: {
    height: number;
    weight: number;
  };
  recommendations: string[];
}

// ============================================
// GROWTH TRACKING ACTIONS
// ============================================

/**
 * Add a growth entry
 *
 * Adds a new growth measurement entry to the user's registry.
 *
 * @param input - Growth entry data
 * @returns Result object with entry details or error
 *
 * @example
 * const result = await addGrowthEntry({
 *   childName: 'Baby Smith',
 *   childBirthDate: '2024-01-15T00:00:00Z',
 *   height: 65,
 *   weight: 7.5,
 *   headCircumference: 42,
 * });
 */
export async function addGrowthEntry(input: AddGrowthEntryInput): Promise<ActionResult<{ entryId: string }>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to add growth entries');
    }

    // Validate input
    const validatedFields = addGrowthEntrySchema.safeParse(input);
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const { childName, childBirthDate, height, weight, headCircumference, notes } = validatedFields.data;

    // Get user's registry
    const registry = await prisma.registry.findUnique({
      where: { userId: user.id },
    });

    if (!registry) {
      return {
        success: false,
        error: 'You need to create a registry first to track growth',
      };
    }

    // Create growth entry
    const entry = await prisma.growthEntry.create({
      data: {
        registryId: registry.id,
        childName: childName || registry.name,
        childBirthDate: childBirthDate ? new Date(childBirthDate) : null,
        height,
        weight,
        headCircumference,
        notes,
      },
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidatePath(`/registry/${registry.shareCode}`);
    revalidateTag('growth');

    return {
      success: true,
      data: { entryId: entry.id },
    };
  } catch (error) {
    console.error('Add growth entry error:', error);
    if (error instanceof UnauthorizedError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while adding the growth entry. Please try again.',
    };
  }
}

/**
 * Update a growth entry
 *
 * Updates an existing growth entry.
 *
 * @param entryId - Growth entry ID to update
 * @param data - Updated growth entry data
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await updateGrowthEntry('entry123', {
 *   height: 68,
 *   weight: 8.0,
 * });
 */
export async function updateGrowthEntry(
  entryId: string,
  data: Partial<Omit<UpdateGrowthEntryInput, 'entryId'>>
): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to update growth entries');
    }

    // Validate input
    const validatedFields = updateGrowthEntrySchema.partial().safeParse({ entryId, ...data });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find growth entry
    const entry = await prisma.growthEntry.findFirst({
      where: {
        id: entryId,
        registry: { userId: user.id },
      },
    });

    if (!entry) {
      throw new NotFoundError('Growth entry not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.headCircumference !== undefined) updateData.headCircumference = data.headCircumference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update entry
    await prisma.growthEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidateTag('growth');

    return { success: true };
  } catch (error) {
    console.error('Update growth entry error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while updating the growth entry. Please try again.',
    };
  }
}

/**
 * Delete a growth entry
 *
 * Deletes a growth entry.
 *
 * @param entryId - Growth entry ID to delete
 * @returns Result object indicating success or failure
 *
 * @example
 * const result = await deleteGrowthEntry('entry123');
 */
export async function deleteGrowthEntry(entryId: string): Promise<ActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to delete growth entries');
    }

    // Validate input
    const validatedFields = deleteGrowthEntrySchema.safeParse({ entryId });
    if (!validatedFields.success) {
      return {
        success: false,
        fieldErrors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Find growth entry
    const entry = await prisma.growthEntry.findFirst({
      where: {
        id: entryId,
        registry: { userId: user.id },
      },
    });

    if (!entry) {
      throw new NotFoundError('Growth entry not found');
    }

    // Delete entry
    await prisma.growthEntry.delete({
      where: { id: entryId },
    });

    revalidatePath('/registry');
    revalidatePath('/account/registry');
    revalidateTag('growth');

    return { success: true };
  } catch (error) {
    console.error('Delete growth entry error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while deleting the growth entry. Please try again.',
    };
  }
}

/**
 * Get size prediction using AI
 *
 * Uses OpenAI to predict future sizes based on growth data.
 *
 * @param childId - Child ID (registry ID)
 * @returns Result object with size predictions or error
 *
 * @example
 * const result = await getSizePrediction('registry123');
 */
export async function getSizePrediction(childId: string): Promise<ActionResult<SizePrediction>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to get size predictions');
    }

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        id: childId,
        userId: user.id,
      },
      include: {
        growthEntries: {
          orderBy: { recordedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    if (registry.growthEntries.length === 0) {
      return {
        success: false,
        error: 'No growth data available. Please add at least one growth entry.',
      };
    }

    // Get the most recent growth entry
    const latestEntry = registry.growthEntries[0];

    // Calculate child's age in months
    const childBirthDate = latestEntry.childBirthDate || registry.eventDate;
    if (!childBirthDate) {
      return {
        success: false,
        error: 'Child birth date is required for size prediction',
      };
    }

    const ageInMonths = Math.floor((Date.now() - childBirthDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Prepare prompt for OpenAI
    const prompt = `
You are a baby growth expert. Based on the following growth data, predict the child's future sizes and provide recommendations.

Child Information:
- Current Age: ${ageInMonths} months
- Current Height: ${latestEntry.height || 'N/A'} cm
- Current Weight: ${latestEntry.weight || 'N/A'} kg
- Head Circumference: ${latestEntry.headCircumference || 'N/A'} cm

Please provide:
1. Current size recommendations (clothing, shoes, diaper)
2. Predicted sizes for the next 6 months (every 2 months)
3. Growth percentile estimates (height and weight)
4. Recommendations for parents

Format your response as JSON with the following structure:
{
  "currentSize": {
    "clothing": "size (e.g., 0-3 months)",
    "shoes": "size (e.g., 0)",
    "diaper": "size (e.g., N)"
  },
  "predictedSizes": [
    {
      "ageMonths": number,
      "clothing": "size",
      "shoes": "size",
      "diaper": "size",
      "height": number,
      "weight": number
    }
  ],
  "growthPercentile": {
    "height": number (0-100),
    "weight": number (0-100)
  },
  "recommendations": ["tip1", "tip2", "tip3"]
}
`;

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a baby growth expert who provides accurate size predictions and recommendations based on growth data.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      const prediction = JSON.parse(responseContent) as SizePrediction;

      // Update registry with AI predictions
      await prisma.registry.update({
        where: { id: registry.id },
        data: {
          predictedSizes: prediction,
        },
      });

      revalidatePath('/registry');
      revalidatePath('/account/registry');
      revalidateTag('growth');

      return {
        success: true,
        data: prediction,
      };
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);

      // Fallback to simple prediction based on growth charts
      const fallbackPrediction = generateFallbackPrediction(
        ageInMonths,
        latestEntry.height,
        latestEntry.weight
      );

      // Update registry with fallback predictions
      await prisma.registry.update({
        where: { id: registry.id },
        data: {
          predictedSizes: fallbackPrediction,
        },
      });

      revalidatePath('/registry');
      revalidatePath('/account/registry');
      revalidateTag('growth');

      return {
        success: true,
        data: fallbackPrediction,
      };
    }
  } catch (error) {
    console.error('Get size prediction error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while generating size predictions. Please try again.',
    };
  }
}

/**
 * Get growth entries for a registry
 *
 * Retrieves all growth entries for a registry.
 *
 * @param registryId - Registry ID
 * @returns Result object with growth entries or error
 *
 * @example
 * const result = await getGrowthEntries('registry123');
 */
export async function getGrowthEntries(registryId: string): Promise<ActionResult<{
  entries: Array<{
    id: string;
    childName: string | null;
    childBirthDate: Date | null;
    height: number | null;
    weight: number | null;
    headCircumference: number | null;
    recordedAt: Date;
    notes: string | null;
  }>;
}>> {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new UnauthorizedError('You must be logged in to view growth entries');
    }

    // Find registry
    const registry = await prisma.registry.findFirst({
      where: {
        id: registryId,
        userId: user.id,
      },
    });

    if (!registry) {
      throw new NotFoundError('Registry not found');
    }

    // Get growth entries
    const entries = await prisma.growthEntry.findMany({
      where: { registryId },
      orderBy: { recordedAt: 'desc' },
    });

    return {
      success: true,
      data: { entries },
    };
  } catch (error) {
    console.error('Get growth entries error:', error);
    if (error instanceof UnauthorizedError || error instanceof NotFoundError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: 'An error occurred while fetching growth entries. Please try again.',
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate fallback size prediction based on growth charts
 * Used when OpenAI API is unavailable
 */
function generateFallbackPrediction(
  ageInMonths: number,
  height: number | null,
  weight: number | null
): SizePrediction {
  // Simple size mapping based on age
  const sizeMap: Record<number, { clothing: string; shoes: string; diaper: string }> = {
    0: { clothing: 'Newborn', shoes: '0', diaper: 'N' },
    3: { clothing: '0-3 months', shoes: '1', diaper: 'N' },
    6: { clothing: '3-6 months', shoes: '2', diaper: '1' },
    9: { clothing: '6-9 months', shoes: '3', diaper: '2' },
    12: { clothing: '12 months', shoes: '4', diaper: '3' },
    18: { clothing: '18 months', shoes: '5', diaper: '4' },
    24: { clothing: '24 months', shoes: '6', diaper: '5' },
  };

  // Find closest age bracket
  const ages = Object.keys(sizeMap).map(Number).sort((a, b) => a - b);
  let closestAge = ages[0];
  for (const age of ages) {
    if (ageInMonths >= age) {
      closestAge = age;
    } else {
      break;
    }
  }

  const currentSize = sizeMap[closestAge];

  // Generate predictions for next 6 months
  const predictedSizes = [];
  for (let i = 2; i <= 6; i += 2) {
    const futureAge = ageInMonths + i;
    let futureSize = currentSize;

    for (const age of ages) {
      if (futureAge >= age) {
        futureSize = sizeMap[age];
      } else {
        break;
      }
    }

    // Estimate height and weight growth
    const estimatedHeight = height ? height + (i * 1.5) : 50 + (futureAge * 2.5);
    const estimatedWeight = weight ? weight + (i * 0.5) : 3.5 + (futureAge * 0.5);

    predictedSizes.push({
      ageMonths: futureAge,
      clothing: futureSize.clothing,
      shoes: futureSize.shoes,
      diaper: futureSize.diaper,
      height: Math.round(estimatedHeight * 10) / 10,
      weight: Math.round(estimatedWeight * 10) / 10,
    });
  }

  // Calculate percentiles (simplified)
  const heightPercentile = height ? Math.min(95, Math.max(5, 50 + ((height - (50 + ageInMonths * 2.5)) / 2))) : 50;
  const weightPercentile = weight ? Math.min(95, Math.max(5, 50 + ((weight - (3.5 + ageInMonths * 0.5)) * 10))) : 50;

  return {
    currentSize,
    predictedSizes,
    growthPercentile: {
      height: Math.round(heightPercentile),
      weight: Math.round(weightPercentile),
    },
    recommendations: [
      'Continue tracking your baby\'s growth regularly',
      'Consult your pediatrician if you have concerns about growth',
      'Ensure proper nutrition for healthy development',
      'Remember every baby grows at their own pace',
    ],
  };
}
