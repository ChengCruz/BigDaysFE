// src/utils/formFieldTemplates.ts
// Predefined wedding-specific RSVP question templates.
// "Will you attend?" is excluded — it is a system default question.

export interface QuestionTemplate {
  label: string;          // display name in the picker UI
  text: string;           // question text sent to the API
  type: number;           // numeric type enum (matches FormFieldModal TYPE_MAP)
  typeKey: string;        // human-readable type label for the picker badge
  isRequired: boolean;
  options?: string;       // comma-separated options for select/radio/checkbox
  order: number;
}

export const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    label: "Meal preference",
    text: "Meal preference",
    type: 2,             // select
    typeKey: "Dropdown",
    isRequired: false,
    options: "Standard,Vegetarian,Halal,Vegan,Gluten-free,Other",
    order: 1,
  },
  {
    label: "Dietary restrictions",
    text: "Do you have any dietary restrictions or allergies?",
    type: 0,             // text (open text)
    typeKey: "Short Text",
    isRequired: false,
    order: 2,
  },
  {
    label: "Special assistance",
    text: "Do you require special assistance?",
    type: 2,             // select
    typeKey: "Dropdown",
    isRequired: false,
    options: "No,Wheelchair access,Elderly seating,Other",
    order: 3,
  },
  {
    label: "Which side",
    text: "Which side are you celebrating with?",
    type: 3,             // radio
    typeKey: "Radio Buttons",
    isRequired: false,
    options: "Bride,Groom,Both",
    order: 4,
  },
  {
    label: "After-party attendance",
    text: "Will you attend the after-party?",
    type: 3,             // radio
    typeKey: "Radio Buttons",
    isRequired: false,
    options: "Yes,No",
    order: 5,
  },
  {
    label: "Wishes for the couple",
    text: "Any special wishes or messages for the couple?",
    type: 1,             // textarea
    typeKey: "Long Text",
    isRequired: false,
    order: 6,
  },
];
