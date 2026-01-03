import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Browser, BrowserContext, chromium, Page } from 'playwright';

// Create server instance
const server = new Server(
  {
    name: 'browser-vision-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Browser instance for reuse
let browser: Browser | undefined;
let page: Page | undefined;

// Initialize browser on first use
async function ensureBrowser(): Promise<Page> {
  if (!browser) {
    browser = await chromium.launch();
  }
  if (!page) {
    const context: BrowserContext = await browser.newContext();
    page = await context.newPage();
  }
  
  if (!page) {
    throw new Error('Failed to create browser page');
  }
  
  return page;
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'navigate_to_url',
        description: 'Navigate to a specific URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The URL to navigate to',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'analyze_page_visual',
        description: 'Analyze the current page visually and describe its content',
        inputSchema: {
          type: 'object',
          properties: {
            analysisType: {
              type: 'string',
              enum: ['basic', 'detailed', 'layout', 'elements'],
              description: 'Type of visual analysis to perform',
              default: 'basic',
            },
          },
          required: [],
        },
      },
      {
        name: 'take_screenshot',
        description: 'Take a screenshot of the current page',
        inputSchema: {
          type: 'object',
          properties: {
            fullPage: {
              type: 'boolean',
              description: 'Take a full-page screenshot',
              default: false,
            },
            path: {
              type: 'string',
              description: 'Optional path to save the screenshot',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_page_content',
        description: 'Get the current page content (text, links, images)',
        inputSchema: {
          type: 'object',
          properties: {
            includeHTML: {
              type: 'boolean',
              description: 'Include raw HTML content',
              default: false,
            },
          },
          required: [],
        },
      },
      {
        name: 'click_element',
        description: 'Click on a specific element by selector',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector of the element to click',
            },
          },
          required: ['selector'],
        },
      },
      {
        name: 'fill_form_field',
        description: 'Fill a form field with text',
        inputSchema: {
          type: 'object',
          properties: {
            selector: {
              type: 'string',
              description: 'CSS selector of the form field',
            },
            text: {
              type: 'string',
              description: 'Text to fill in the field',
            },
          },
          required: ['selector', 'text'],
        },
      },
      {
        name: 'scroll_page',
        description: 'Scroll the page',
        inputSchema: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['up', 'down', 'left', 'right'],
              description: 'Direction to scroll',
            },
            amount: {
              type: 'number',
              description: 'Amount to scroll in pixels',
              default: 500,
            },
          },
          required: ['direction'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'navigate_to_url': {
        const { url } = args;
        const page = await ensureBrowser();
        await page.goto(url);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully navigated to ${url}`,
            },
          ],
        };
      }

      case 'analyze_page_visual': {
        const { analysisType = 'basic' } = args;
        const page = await ensureBrowser();
        
        const analysis = await page.evaluate((type: string) => {
          const results = {
            basic: {
              title: document.title,
              url: window.location.href,
              viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
              },
            },
            detailed: {},
            layout: {},
            elements: {},
          };

          // Basic analysis
          if (type === 'basic' || type === 'detailed') {
            results.detailed = {
              ...results.basic,
              headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
                level: h.tagName,
                text: h.textContent.trim(),
              })),
              links: Array.from(document.querySelectorAll('a[href]')).map(a => {
                const anchor = a as HTMLAnchorElement;
                return {
                  text: anchor.textContent.trim(),
                  href: anchor.href,
                };
              }),
              images: Array.from(document.querySelectorAll('img')).map(img => {
                const image = img as HTMLImageElement;
                return {
                  src: image.src,
                  alt: image.alt,
                  width: image.width,
                  height: image.height,
                };
              }),
              forms: Array.from(document.querySelectorAll('form')).map(form => ({
                action: form.action,
                method: form.method,
                inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => {
                  const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                  return {
                    type: element.type || element.tagName.toLowerCase(),
                    name: element.name,
                    placeholder: 'placeholder' in element ? element.placeholder : '',
                  };
                }),
              })),
            };
          }

          // Layout analysis
          if (type === 'layout' || type === 'detailed') {
            const rect = document.body.getBoundingClientRect();
            results.layout = {
              bodyDimensions: {
                width: rect.width,
                height: rect.height,
              },
              scrollHeight: document.body.scrollHeight,
              scrollWidth: document.body.scrollWidth,
              hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
              hasVerticalScroll: document.body.scrollHeight > window.innerHeight,
            };
          }

          // Elements analysis
          if (type === 'elements' || type === 'detailed') {
            results.elements = {
              interactiveElements: Array.from(document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]')).map((el: Element) => ({
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                text: el.textContent.trim().slice(0, 100),
                attributes: Array.from(el.attributes).reduce((acc: Record<string, string>, attr) => {
                  acc[attr.name] = attr.value;
                  return acc;
                }, {}),
              })),
            };
          }

          return results;
        }, analysisType);

        return {
          content: [
            {
              type: 'text',
              text: `Visual analysis (${analysisType}):\n${JSON.stringify(analysis, null, 2)}`,
            },
          ],
        };
      }

      case 'take_screenshot': {
        const { fullPage = false, path } = args;
        const page = await ensureBrowser();
        
        const screenshot = await page.screenshot({ 
          fullPage,
          path,
        });

        return {
          content: [
            {
              type: 'text',
              text: `Screenshot taken${fullPage ? ' (full page)' : ''}${path ? ` and saved to ${path}` : ''}`,
            },
          ],
        };
      }

      case 'get_page_content': {
        const { includeHTML = false } = args;
        const page = await ensureBrowser();

        const content = await page.evaluate((includeHTML: boolean) => {
          return {
            title: document.title,
            url: window.location.href,
            textContent: document.body.textContent,
            links: Array.from(document.querySelectorAll('a[href]')).map(a => {
              const anchor = a as HTMLAnchorElement;
              return {
                text: anchor.textContent.trim(),
                href: anchor.href,
              };
            }),
            images: Array.from(document.querySelectorAll('img')).map(img => {
              const image = img as HTMLImageElement;
              return {
                src: image.src,
                alt: image.alt,
              };
            }),
            forms: Array.from(document.querySelectorAll('form')).map(form => ({
              action: form.action,
              method: form.method,
              inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => {
                const element = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                return {
                  type: element.type || element.tagName.toLowerCase(),
                  name: element.name,
                  placeholder: 'placeholder' in element ? element.placeholder : '',
                };
              }),
            })),
            ...(includeHTML && { html: document.documentElement.outerHTML }),
          };
        }, includeHTML);

        return {
          content: [
            {
              type: 'text',
              text: `Page content:\n${JSON.stringify(content, null, 2)}`,
            },
          ],
        };
      }

      case 'click_element': {
        const { selector } = args;
        const page = await ensureBrowser();
        
        await page.click(selector);
        
        return {
          content: [
            {
              type: 'text',
              text: `Clicked element with selector: ${selector}`,
            },
          ],
        };
      }

      case 'fill_form_field': {
        const { selector, text } = args;
        const page = await ensureBrowser();
        
        await page.fill(selector, text);
        
        return {
          content: [
            {
              type: 'text',
              text: `Filled field ${selector} with text: ${text}`,
            },
          ],
        };
      }

      case 'scroll_page': {
        const { direction, amount = 500 } = args;
        const page = await ensureBrowser();
        
        const scrollOptions: { scrollTop?: number; scrollLeft?: number } = {};
        switch (direction) {
          case 'up':
            scrollOptions.scrollTop = -amount;
            break;
          case 'down':
            scrollOptions.scrollTop = amount;
            break;
          case 'left':
            scrollOptions.scrollLeft = -amount;
            break;
          case 'right':
            scrollOptions.scrollLeft = amount;
            break;
        }
        
        await page.evaluate((options: { scrollTop?: number; scrollLeft?: number }) => {
          if (options.scrollTop) {
            window.scrollBy(0, options.scrollTop);
          }
          if (options.scrollLeft) {
            window.scrollBy(options.scrollLeft, 0);
          }
        }, scrollOptions);
        
        return {
          content: [
            {
              type: 'text',
              text: `Scrolled ${direction} by ${amount} pixels`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Browser Vision MCP server running on stdio');
}

// Cleanup function
async function cleanup() {
  if (browser) {
    await browser.close();
  }
}

// Register cleanup handlers
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

main().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});