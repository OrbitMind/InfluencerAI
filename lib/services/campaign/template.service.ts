import { CampaignTemplateRepository, type TemplateFilters } from '@/lib/repositories/campaign-template.repository';
import type { TemplateVariable } from '@/lib/types/campaign';

export class TemplateService {
  private repository = new CampaignTemplateRepository();

  async listTemplates(filters?: TemplateFilters) {
    return this.repository.findAll(filters);
  }

  async getTemplate(id: string) {
    const template = await this.repository.findById(id);
    if (!template) throw new Error('Template não encontrado');
    return template;
  }

  async getTemplateBySlug(slug: string) {
    const template = await this.repository.findBySlug(slug);
    if (!template) throw new Error('Template não encontrado');
    return template;
  }

  resolvePrompt(
    template: string,
    values: Record<string, string>,
    personaBasePrompt?: string
  ): string {
    let resolved = template;

    // Replace {{persona_base}} with the persona's base prompt
    if (personaBasePrompt) {
      resolved = resolved.replace(/\{\{persona_base\}\}/g, personaBasePrompt);
    }

    // Replace all other {{placeholder}} with provided values
    for (const [key, value] of Object.entries(values)) {
      resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Remove any remaining unresolved placeholders
    resolved = resolved.replace(/\{\{[^}]+\}\}/g, '').replace(/\s{2,}/g, ' ').trim();

    return resolved;
  }

  resolveNarration(template: string, values: Record<string, string>): string {
    return this.resolvePrompt(template, values);
  }

  validateVariables(
    templateVars: TemplateVariable[],
    provided: Record<string, string>
  ): string[] {
    const errors: string[] = [];

    for (const variable of templateVars) {
      if (variable.required && !provided[variable.name]?.trim()) {
        errors.push(`Campo "${variable.label}" é obrigatório`);
      }

      if (variable.type === 'select' && variable.options && provided[variable.name]) {
        if (!variable.options.includes(provided[variable.name])) {
          errors.push(`Valor inválido para "${variable.label}"`);
        }
      }
    }

    return errors;
  }
}
