import axios from 'axios';

export class EdamamService {
  private appId = process.env.EDAMAM_APP_ID;
  private apiKey = process.env.EDAMAM_API_KEY;
  private parserUrl = 'https://api.edamam.com/api/food-database/v2/parser';
  private nutrientsUrl = 'https://api.edamam.com/api/food-database/v2/nutrients';

  async analyzeFoodFromText(ingr: string) {
    try {
      const parserResponse = await axios.get(this.parserUrl, {
        params: {
          app_id: this.appId,
          app_key: this.apiKey,
          ingr,
          nutrition_type: 'logging',
        },
      });

      const parsedItems = parserResponse.data.parsed || [];

      if (parsedItems.length === 0) {
        throw new Error('No recognizable food items found in the input.');
      }

      console.log('Parsed items count:', parsedItems.length);
      console.log('Parsed labels:', parsedItems.map(i => i.food.label));

      const ingredients = parsedItems.map(item => {
        const quantity = item.quantity || 1;
        const measureURI = item.measure?.uri;
        const foodId = item.food?.foodId;

        if (!measureURI || !foodId) {
          throw new Error('Missing foodId or measureURI in one of the parsed items.');
        }

        return { quantity, measureURI, foodId };
      });

      const nutrientResponse = await axios.post(
        this.nutrientsUrl,
        { ingredients },
        {
          params: {
            app_id: this.appId,
            app_key: this.apiKey,
          },
        },
      );

      const detailedItems = nutrientResponse.data.ingredients || [];

      const result = parsedItems.map((item, index) => {
        const nutrients = detailedItems[index]?.parsed?.[0]?.nutrients || {};
        return {
          foodName: item.food.label,
          quantity: item.quantity || 1,
          calories: nutrients.ENERC_KCAL || 0,
          protein: nutrients.PROCNT || 0,
          carbs: nutrients.CHOCDF || 0,
          fats: nutrients.FAT || 0,
        };
      });

      return result;
    } catch (error) {
      console.error('Error analyzing food:', error?.response?.data || error.message);
      throw error;
    }
  }
}
