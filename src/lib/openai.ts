import OpenAI from 'openai';

/**
 * OpenAI Client Configuration
 *
 * Provides a configured OpenAI client and helper functions for AI-powered features.
 * Used for product recommendations, registry suggestions, size predictions, and embeddings.
 *
 * @see https://platform.openai.com/docs/api-reference
 */

// Validate required environment variable
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Model configurations
 */
export const MODELS = {
  EMBEDDING: 'text-embedding-3-small',
  CHAT: 'gpt-4o-mini',
  CHAT_ADVANCED: 'gpt-4o',
} as const;

/**
 * Embedding vector type
 */
export type EmbeddingVector = number[];

/**
 * Product data for embedding generation
 */
export interface ProductEmbeddingData {
  id: string;
  name: string;
  description: string;
  category: string;
  brand?: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
}

/**
 * Size prediction input data
 */
export interface SizePredictionInput {
  babyAgeMonths: number;
  babyWeightKg?: number;
  babyHeightCm?: number;
  productType: 'clothing' | 'shoes' | 'diapers';
  brand?: string;
}

/**
 * Size prediction result
 */
export interface SizePredictionResult {
  recommendedSize: string;
  confidence: number;
  alternatives: Array<{
    size: string;
    confidence: number;
  }>;
  reasoning: string;
}

/**
 * Registry suggestion input
 */
export interface RegistrySuggestionInput {
  dueDate?: string;
  babyGender?: 'male' | 'female' | 'neutral';
  budget?: 'low' | 'medium' | 'high';
  preferences?: string[];
  existingItems?: string[];
}

/**
 * Registry suggestion result
 */
export interface RegistrySuggestion {
  productId: string;
  productName: string;
  category: string;
  priority: 'essential' | 'recommended' | 'nice-to-have';
  quantity: number;
  reasoning: string;
}

/**
 * Recommendation context
 */
export interface RecommendationContext {
  browsingHistory?: string[];
  purchaseHistory?: string[];
  cartItems?: string[];
  wishlistItems?: string[];
  registryItems?: string[];
  preferences?: string[];
  budget?: number;
}

/**
 * Generates an embedding vector for a product
 * Used for semantic similarity search and recommendations
 *
 * @param product - Product data to generate embedding for
 * @returns Embedding vector
 */
export async function generateProductEmbedding(
  product: ProductEmbeddingData
): Promise<EmbeddingVector> {
  const text = [
    product.name,
    product.description,
    product.category,
    product.brand || '',
    (product.tags || []).join(' '),
    (product.colors || []).join(' '),
    (product.sizes || []).join(' '),
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const response = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate product embedding:', error);
    throw new Error('Failed to generate product embedding');
  }
}

/**
 * Generates embeddings for multiple products in batch
 *
 * @param products - Array of product data
 * @returns Array of embedding vectors with product IDs
 */
export async function generateProductEmbeddings(
  products: ProductEmbeddingData[]
): Promise<Array<{ productId: string; embedding: EmbeddingVector }>> {
  const texts = products.map((product) =>
    [
      product.name,
      product.description,
      product.category,
      product.brand || '',
      (product.tags || []).join(' '),
      (product.colors || []).join(' '),
      (product.sizes || []).join(' '),
    ]
      .filter(Boolean)
      .join(' ')
  );

  try {
    const response = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: texts,
    });

    return response.data.map((item, index) => ({
      productId: products[index].id,
      embedding: item.embedding,
    }));
  } catch (error) {
    console.error('Failed to generate product embeddings batch:', error);
    throw new Error('Failed to generate product embeddings batch');
  }
}

/**
 * Generates an embedding for a search query
 *
 * @param query - Search query string
 * @returns Embedding vector
 */
export async function generateQueryEmbedding(query: string): Promise<EmbeddingVector> {
  try {
    const response = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: query,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate query embedding:', error);
    throw new Error('Failed to generate query embedding');
  }
}

/**
 * Predicts the best size for a baby based on growth data
 *
 * @param input - Size prediction input data
 * @returns Size prediction result with recommendations
 */
export async function predictSize(input: SizePredictionInput): Promise<SizePredictionResult> {
  const systemPrompt = `You are a baby product sizing expert. Based on the baby's age, weight, height, and the product type, recommend the best size. Consider that babies grow quickly and parents often want items that will fit for a while.

Respond in JSON format:
{
  "recommendedSize": "string - the recommended size",
  "confidence": "number between 0 and 1",
  "alternatives": [
    {"size": "string", "confidence": "number between 0 and 1"}
  ],
  "reasoning": "string - brief explanation of the recommendation"
}`;

  const userPrompt = `Please recommend a size for:
- Baby age: ${input.babyAgeMonths} months
- Baby weight: ${input.babyWeightKg ? `${input.babyWeightKg} kg` : 'unknown'}
- Baby height: ${input.babyHeightCm ? `${input.babyHeightCm} cm` : 'unknown'}
- Product type: ${input.productType}
- Brand: ${input.brand || 'not specified'}

Consider typical baby growth patterns and brand sizing variations.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content) as SizePredictionResult;
  } catch (error) {
    console.error('Failed to predict size:', error);
    throw new Error('Failed to predict size');
  }
}

/**
 * Generates AI-powered registry suggestions
 *
 * @param input - Registry suggestion input
 * @returns Array of product suggestions
 */
export async function generateRegistrySuggestions(
  input: RegistrySuggestionInput
): Promise<RegistrySuggestion[]> {
  const systemPrompt = `You are a baby registry expert helping parents prepare for their new arrival. Suggest essential and recommended products based on the provided information.

Consider:
- Baby's due date (seasonal needs)
- Gender preferences if specified
- Budget constraints
- Parent preferences
- Items already on the registry

Respond in JSON format:
{
  "suggestions": [
    {
      "productName": "string - generic product name",
      "category": "string - product category",
      "priority": "essential | recommended | nice-to-have",
      "quantity": "number - recommended quantity",
      "reasoning": "string - why this item is recommended"
    }
  ]
}`;

  const userPrompt = `Please suggest items for a baby registry:
- Due date: ${input.dueDate || 'not specified'}
- Baby gender: ${input.babyGender || 'not specified'}
- Budget preference: ${input.budget || 'medium'}
- Parent preferences: ${(input.preferences || []).join(', ') || 'none specified'}
- Already have: ${(input.existingItems || []).join(', ') || 'none'}

Provide 10-15 suggestions prioritized by importance.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content) as { suggestions: RegistrySuggestion[] };
    return parsed.suggestions;
  } catch (error) {
    console.error('Failed to generate registry suggestions:', error);
    throw new Error('Failed to generate registry suggestions');
  }
}

/**
 * Generates personalized product recommendations
 *
 * @param context - Recommendation context with user data
 * @param availableProducts - List of available products to recommend from
 * @returns Array of recommended product IDs with scores
 */
export async function generateRecommendations(
  context: RecommendationContext,
  availableProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    tags?: string[];
  }>
): Promise<Array<{ productId: string; score: number; reason: string }>> {
  const systemPrompt = `You are a personalized shopping assistant for a baby products store. Based on the user's browsing history, purchase history, and preferences, recommend the most relevant products.

Consider:
- Products they've viewed or purchased before
- Items in their cart or wishlist
- Their stated preferences
- Their budget if specified
- Complementary products (e.g., diapers if they bought wipes)

Respond in JSON format:
{
  "recommendations": [
    {
      "productId": "string - the product ID",
      "score": "number between 0 and 1 - relevance score",
      "reason": "string - brief explanation of why this is recommended"
    }
  ]
}`;

  const userPrompt = `Please recommend products based on:
- Browsing history: ${(context.browsingHistory || []).slice(0, 10).join(', ') || 'none'}
- Purchase history: ${(context.purchaseHistory || []).slice(0, 10).join(', ') || 'none'}
- Cart items: ${(context.cartItems || []).join(', ') || 'none'}
- Wishlist: ${(context.wishlistItems || []).join(', ') || 'none'}
- Registry items: ${(context.registryItems || []).join(', ') || 'none'}
- Preferences: ${(context.preferences || []).join(', ') || 'none'}
- Budget: ${context.budget ? `$${context.budget}` : 'not specified'}

Available products:
${availableProducts
  .slice(0, 50)
  .map((p) => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: $${p.price}, Tags: ${(p.tags || []).join(', ')}`)
  .join('\n')}

Return the top 10 most relevant recommendations.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const parsed = JSON.parse(content) as {
      recommendations: Array<{ productId: string; score: number; reason: string }>;
    };
    return parsed.recommendations;
  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    throw new Error('Failed to generate recommendations');
  }
}

/**
 * Generates a product description based on basic product info
 *
 * @param productInfo - Basic product information
 * @returns Generated product description
 */
export async function generateProductDescription(productInfo: {
  name: string;
  category: string;
  features: string[];
  targetAge?: string;
  brand?: string;
}): Promise<string> {
  const systemPrompt = `You are a copywriter for a baby products e-commerce store. Write compelling, SEO-friendly product descriptions that are informative and appeal to parents.

Guidelines:
- Keep descriptions between 100-150 words
- Highlight key features and benefits
- Use a warm, trustworthy tone
- Include relevant keywords naturally
- Mention safety when applicable`;

  const userPrompt = `Write a product description for:
- Name: ${productInfo.name}
- Category: ${productInfo.category}
- Target age: ${productInfo.targetAge || 'all ages'}
- Brand: ${productInfo.brand || 'Baby Petite'}
- Key features: ${productInfo.features.join(', ')}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content.trim();
  } catch (error) {
    console.error('Failed to generate product description:', error);
    throw new Error('Failed to generate product description');
  }
}

/**
 * Analyzes customer sentiment from reviews
 *
 * @param reviews - Array of review texts
 * @returns Sentiment analysis results
 */
export async function analyzeReviewSentiment(
  reviews: string[]
): Promise<{
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  themes: Array<{ theme: string; sentiment: string; count: number }>;
}> {
  const systemPrompt = `You are a sentiment analysis expert. Analyze customer reviews and provide:
1. Overall sentiment classification
2. A sentiment score from -1 (very negative) to 1 (very positive)
3. Common themes mentioned with their sentiment

Respond in JSON format:
{
  "overall": "positive | neutral | negative",
  "score": "number between -1 and 1",
  "themes": [
    {"theme": "string - the topic", "sentiment": "string - positive/negative/neutral", "count": "number - how many reviews mention this"}
  ]
}`;

  const userPrompt = `Analyze these ${reviews.length} reviews:
${reviews.slice(0, 50).map((r, i) => `${i + 1}. "${r}"`).join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('Failed to analyze review sentiment:', error);
    throw new Error('Failed to analyze review sentiment');
  }
}

/**
 * Generates a chat response for customer support
 *
 * @param message - Customer message
 * @param context - Conversation context
 * @returns AI-generated response
 */
export async function generateSupportResponse(
  message: string,
  context: {
    previousMessages?: Array<{ role: 'user' | 'assistant'; content: string }>;
    orderInfo?: string;
    userInfo?: string;
  } = {}
): Promise<string> {
  const systemPrompt = `You are a helpful customer support assistant for Baby Petite, a baby products e-commerce store. You help customers with:
- Order status and tracking
- Product recommendations
- Size guidance
- Returns and exchanges
- General questions about baby products

Be friendly, helpful, and concise. If you don't know something, suggest contacting human support.
Never make up order details or policies.`;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  if (context.userInfo) {
    messages.push({ role: 'system', content: `Customer info: ${context.userInfo}` });
  }

  if (context.orderInfo) {
    messages.push({ role: 'system', content: `Order context: ${context.orderInfo}` });
  }

  if (context.previousMessages) {
    messages.push(...context.previousMessages);
  }

  messages.push({ role: 'user', content: message });

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.CHAT,
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return content.trim();
  } catch (error) {
    console.error('Failed to generate support response:', error);
    throw new Error('Failed to generate support response');
  }
}

export default openai;
