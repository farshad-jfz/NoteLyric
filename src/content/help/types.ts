export type HelpEntry = {
  id: string;
  title: string;
  shortDescription: string;
  practiceTip?: string;
  theory?: string;
  fullDescription?: string;
  howToPractice?: string[];
  commonMistakes?: string[];
  bestFor?: string;
};