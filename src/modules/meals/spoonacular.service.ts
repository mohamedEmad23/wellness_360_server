import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Food, FoodDocument } from '.././../infrastructure/database/schemas/food.schema'; // Update path if needed

@Injectable()
export class SpoonacularService {
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://api.spoonacular.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(Food.name) private readonly foodModel: Model<FoodDocument>,
  ) {
    this.apiKey = this.configService.get<string>('SPOONACULAR_API_KEY');
    if (!this.apiKey) {
      console.warn('SPOONACULAR_API_KEY is not set in environment variables');
    }
  }

  private transformToFoodSchema(data: any, type: Food['type'], createdBy?: Types.ObjectId): Partial<Food> {
    return {
      name: data.title || data.name,
      description: data.description || 'No description available.',
      calories: data.nutrition?.nutrients?.find((n) => n.name === 'Calories')?.amount || 0,
      protein: data.nutrition?.nutrients?.find((n) => n.name === 'Protein')?.amount || 0,
      carbs: data.nutrition?.nutrients?.find((n) => n.name === 'Carbohydrates')?.amount || 0,
      fats: data.nutrition?.nutrients?.find((n) => n.name === 'Fat')?.amount || 0,
      type,
      isCustom: false,
      createdBy,
    };
  }

  /**
   * Search for a food by name and return the first result mapped to Food schema
   */
  async searchFoodByName(name: string, type: Food['type'], userId?: string) {
    try {
      const searchResult = await lastValueFrom(
        this.httpService
          .get(`${this.baseUrl}/food/products/search`, {
            params: {
              query: name,
              number: 1,
              apiKey: this.apiKey,
            },
          })
          .pipe(
            map((res) => res.data),
            catchError((error) => {
              throw new HttpException(
                `Spoonacular API error: ${error.response?.data?.message || error.message}`,
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      if (!searchResult.products || searchResult.products.length === 0) {
        throw new HttpException('No food found with that name.', HttpStatus.NOT_FOUND);
      }

      const firstProduct = searchResult.products[0];

      // Get detailed info including nutrition
      const productDetails = await lastValueFrom(
        this.httpService
          .get(`${this.baseUrl}/food/products/${firstProduct.id}`, {
            params: {
              apiKey: this.apiKey,
            },
          })
          .pipe(
            map((res) => res.data),
            catchError((error) => {
              throw new HttpException(
                `Spoonacular API error (details): ${error.response?.data?.message || error.message}`,
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }),
          ),
      );

      const transformed = this.transformToFoodSchema(
        productDetails,
        type,
        userId ? new Types.ObjectId(userId) : undefined,
      );

      // Optionally save to DB
      // const saved = await this.foodModel.create(transformed);
      // return saved;

      return transformed;
    } catch (error) {
      throw new HttpException(
        `Failed to search food: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async searchFoods(query: string, offset = 0, number = 1) {
    const url = `${this.baseUrl}/food/products/search?query=${query}&offset=${offset}&number=${number}&apiKey=${this.apiKey}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data.products;
  }

  async getFoodInformation(id: number) {
    const url = `${this.baseUrl}/food/products/${id}?apiKey=${this.apiKey}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  async getFoodNutrients(id: number) {
    const url = `${this.baseUrl}/food/products/${id}?apiKey=${this.apiKey}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data.nutrition;
  }

  async getNutritionByQuery(query: string) {
    const url = `${this.baseUrl}/recipes/guessNutrition?title=${encodeURIComponent(query)}&apiKey=${this.apiKey}`;
    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }
}