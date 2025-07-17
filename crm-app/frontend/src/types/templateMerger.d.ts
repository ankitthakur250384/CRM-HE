// Type declarations for templateMerger
declare module '../utils/templateMerger' {
  import { Quotation } from '../types/quotation';
  import { Template } from '../types/template';
  
  export function mergeQuotationWithTemplate(quotation: Quotation, template: Template): string;
  
  const _default: {
    mergeQuotationWithTemplate: typeof mergeQuotationWithTemplate;
  };
  export default _default;
}
