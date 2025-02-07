import mjml2html from 'mjml';
import Handlebars from 'handlebars';
import errorTemplate from "../templates/emails/error.email";
import { htmlToText } from 'html-to-text';

// Template registry
const templateRegistry: Record<string, string> = {
  'server-error': errorTemplate
};

export default async function renderTemplate(templateName: string, context: Record<string, any>) {
  const getTemplateContent = (name: string): string => {
    const template = templateRegistry[name];
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    return template;
  };

  try {
    // Compile and execute the template
    const template = Handlebars.compile(getTemplateContent(templateName));
    const rendered = template(context);

    // Convert MJML to HTML
    const { html, errors } = mjml2html(rendered, {
      validationLevel: 'skip',
      keepComments: false,
    });
    if (errors.length > 0) {
      console.error('MJML Errors:', errors);
    }

    // Generate plaintext version
    const text = htmlToText(html, {
      wordwrap: 130,
      selectors: [
        { selector: 'img', format: 'skip' },
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } }
      ]
    });

    return { html, text };
  } catch (error) {
    throw new Error(`Failed to render template: ${(error as Error).message}`);
  }
}
