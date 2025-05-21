import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as dotenv from 'dotenv';
import { CreateFoodLogDto } from 'src/modules/edamam/dto/create-food-log.dto';

dotenv.config();

@Injectable()
export class EdamamService {
  private readonly appId = process.env.EDAMAM_APP_ID;
  private readonly appKey = process.env.EDAMAM_APP_KEY;
  private readonly parserUrl = 'https://api.edamam.com/api/food-database/v2/parser';
  private readonly nutrientsUrl = 'https://api.edamam.com/api/food-database/v2/nutrients';

  constructor(private readonly httpService: HttpService) {}

  async analyzeFoodFromText(ingr: string): Promise<CreateFoodLogDto> {
    try {

      const parserResponse = await firstValueFrom(
        this.httpService.get(this.parserUrl, {
          params: {
            app_id: this.appId,
            app_key: this.appKey,
            ingr,
          },
        }),
      );

      const parsed = parserResponse.data.parsed;
      const hints = parserResponse.data.hints;

      if (parsed.length === 0 || hints.length === 0) {
        throw new HttpException(
          'No recognizable food found in the input.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (parsed.length > 1) {
        throw new HttpException('Multiple foods found in the input.', HttpStatus.BAD_REQUEST);
      }

      const firstParsedItem = parsed[0];
      const firstHintItem = hints[0];

      const quantity = firstParsedItem.quantity || 1;

      const validMeasure = firstParsedItem.measure.uri || firstHintItem.measures.uri;
      
      if (!validMeasure) {
        throw new HttpException('No valid measure found for this food', HttpStatus.BAD_REQUEST);
      }
      
      const ingredients = [
        {
          quantity,
          measureURI: validMeasure.uri,
          foodId: firstParsedItem.food.foodId
        }
      ];
      const foodLog = await this.getNutrientsForFoodId(
        firstParsedItem.food.foodId,
        validMeasure,
        quantity,
        ingr
      );
      return foodLog;
    } catch (error) {
      // console.error('Error analyzing food:', error?.response?.data || error.message);
      // console.error('Full error:', error);
      // throw new HttpException('Failed to analyze food input', HttpStatus.INTERNAL_SERVER_ERROR);
      // if status code is 400, throw a 400 error
      if (error?.status === 400) {
        throw new HttpException('Use only one food at a time', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Failed to analyze food input', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getNutrientsForFoodId(foodId: string, measureURI: string, quantity: number, title: string): Promise<CreateFoodLogDto> {
    try {
      const ingredients = [{ quantity, measureURI, foodId }];
  
      const response = await firstValueFrom(
        this.httpService.post(
          this.nutrientsUrl,
          { ingredients },
          {
            params: {
              app_id: this.appId,
              app_key: this.appKey,
            },
          },
        ),
      );
  
      const totalNutrients = response.data.totalNutrients;
  
      return {
        foodName: response.data.ingredients[0].parsed[0].food,
        title: title,
        calories: totalNutrients.ENERC_KCAL.quantity ?? 0,
        protein: totalNutrients.PROCNT.quantity ?? 0,
        fats: totalNutrients.FAT.quantity ?? 0,
        carbs: totalNutrients.CHOCDF.quantity ?? 0,
      };
    } catch (error) {
      console.error('Error fetching nutrients:', error?.response?.data || error.message);
      throw new HttpException('Failed to fetch nutrient information', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }  

  async searchFoodSuggestions(query: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.parserUrl, {
          params: {
            app_id: this.appId,
            app_key: this.appKey,
            ingr: query,
          },
        }),
      );
  
      const hints = response.data.hints;
  
      return hints.map((hint) => ({
        label: hint.food.label,
        foodId: hint.food.foodId,
        brand: hint.food.brand,
        category: hint.food.category,
        measures: hint.measures.map((m) => ({
          label: m.label,
          uri: m.uri,
        })),
      }));
    } catch (error) {
      console.error('Error fetching suggestions:', error?.response?.data || error.message);
      throw new HttpException('Failed to fetch food suggestions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }  
}
