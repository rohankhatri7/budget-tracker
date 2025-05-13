import { z } from "zod";

//validate category creation input
export const CreateCategorySchema = z.object( {
    name: z.string().min(3).max(20),
    icon: z.string().max(20),
    type: z.enum(["income", "expense"]),
});
//Typescript type from schema
export type CreateCategorySchemaType =z.infer<typeof CreateCategorySchema>;
