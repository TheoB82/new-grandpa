export interface Recipe {
    CategoryGR: string;
    CategoryEN: string;
  
    Image?: string;
  
    TitleGR: string;
    TitleEN: string;
  
    ShortDescriptionGR: string;
    ShortDescriptionEN: string;
  
    IngredientsGR: string;   // HTML string
    IngredientsEN: string;   // HTML string
  
    LongDescriptionGR?: string; // Optional HTML
    LongDescriptionEN?: string; // Optional HTML
  
    ExecutionGR?: string;    // HTML string
    ExecutionEN?: string;    // HTML string
  
    TagsGR: string; // JSON string (array inside string)
    TagsEN: string;
  
    LinkYT: string;

    ShortID: string;


    Date: string; // dd/mm/yyyy or yyyy-mm-dd

    // Enrichment fields (backfilled via scripts/enrich-recipes.mjs; optional until fully populated)
    PrepTimeMinutes?: number;
    CookTimeMinutes?: number;
    Servings?: number;
    Difficulty?: "Easy" | "Medium" | "Hard";
    CaloriesPerServing?: number;
    CaloriesEstimated?: boolean; // true = AI-estimated, not lab-verified
  }
  