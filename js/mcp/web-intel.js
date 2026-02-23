// MCP Arena - web-intel MCP Server
// Exposes web data extraction as MCP tools (mock data for demo)

import { defineTool } from '../types.js';

// Mock product catalog (simulates real web pages)
const MOCK_PAGES = {
  'https://shop.example.com/products/widget-alpha': {
    title: 'Widget Alpha - Premium Sorting Component',
    url: 'https://shop.example.com/products/widget-alpha',
    metadata: { category: 'industrial', sku: 'WA-2026-001' },
    content: {
      name: 'Widget Alpha',
      price: '$24.99',
      dimensions: { width: '8cm', height: '6cm', depth: '4cm' },
      weight: '1.2kg',
      color: 'Red',
      material: 'Aluminum alloy',
      description: 'High-precision sorting component for automated assembly lines.',
      in_stock: true,
      rating: 4.7,
      reviews: 342,
    },
  },
  'https://shop.example.com/products/widget-beta': {
    title: 'Widget Beta - Standard Processing Unit',
    url: 'https://shop.example.com/products/widget-beta',
    metadata: { category: 'electronics', sku: 'WB-2026-002' },
    content: {
      name: 'Widget Beta',
      price: '$18.50',
      dimensions: { width: '5cm', height: '5cm', depth: '3cm' },
      weight: '0.8kg',
      color: 'Blue',
      material: 'Polycarbonate',
      description: 'Compact processing unit for data center automation.',
      in_stock: true,
      rating: 4.3,
      reviews: 187,
    },
  },
  'https://shop.example.com/products/widget-gamma': {
    title: 'Widget Gamma - Heavy Duty Base Station',
    url: 'https://shop.example.com/products/widget-gamma',
    metadata: { category: 'industrial', sku: 'WG-2026-003' },
    content: {
      name: 'Widget Gamma',
      price: '$89.99',
      dimensions: { width: '15cm', height: '12cm', depth: '10cm' },
      weight: '3.5kg',
      color: 'Green',
      material: 'Reinforced steel',
      description: 'Heavy-duty base station for industrial robot mounts.',
      in_stock: false,
      rating: 4.9,
      reviews: 56,
    },
  },
  'https://shop.example.com/catalog': {
    title: 'Shop Catalog - All Products',
    url: 'https://shop.example.com/catalog',
    metadata: { type: 'catalog', total_products: 3 },
    content: {
      products: [
        { name: 'Widget Alpha', url: '/products/widget-alpha', price: '$24.99', color: 'Red' },
        { name: 'Widget Beta', url: '/products/widget-beta', price: '$18.50', color: 'Blue' },
        { name: 'Widget Gamma', url: '/products/widget-gamma', price: '$89.99', color: 'Green' },
      ],
    },
  },
};

export class WebIntelServer {
  constructor() {
    this.name = 'web-intel';
    this.description = 'Web intelligence gathering via MCP. Extract structured data from web pages.';
    this.pageCache = new Map();
  }

  getTools() {
    return [
      defineTool('fetch_page', 'Fetch a web page and return its content. Returns page title, metadata, and raw content.', {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the page to fetch' },
        },
        required: ['url'],
      }),
      defineTool('extract_data', 'Extract specific data from a previously fetched page using a field path.', {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the previously fetched page' },
          field: { type: 'string', description: 'Dot-notation path to extract (e.g., "dimensions.width", "price", "name")' },
        },
        required: ['url', 'field'],
      }),
      defineTool('search_catalog', 'Search the product catalog by keyword or filter.', {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (product name, color, category)' },
        },
        required: ['query'],
      }),
      defineTool('list_urls', 'List all available URLs that can be fetched.', {
        type: 'object',
        properties: {},
      }),
    ];
  }

  getResources() {
    return [
      { uri: 'web-intel://cache', name: 'Page Cache', description: 'List of cached pages' },
      { uri: 'web-intel://domains', name: 'Allowed Domains', description: 'Whitelisted domains' },
    ];
  }

  async executeTool(toolName, params) {
    switch (toolName) {
      case 'fetch_page': {
        const page = MOCK_PAGES[params.url];
        if (!page) {
          // Check if partial match
          const match = Object.keys(MOCK_PAGES).find(k => k.includes(params.url) || params.url.includes(k));
          if (match) {
            const p = MOCK_PAGES[match];
            this.pageCache.set(match, p);
            return {
              success: true,
              title: p.title,
              url: p.url,
              metadata: p.metadata,
              content: p.content,
              cached: false,
              message: `Page loaded: "${p.title}"`,
            };
          }
          return {
            success: false,
            error: `Page not found: ${params.url}`,
            hint: 'Try list_urls to see available pages, or use https://shop.example.com/catalog',
          };
        }
        this.pageCache.set(params.url, page);
        return {
          success: true,
          title: page.title,
          url: page.url,
          metadata: page.metadata,
          content: page.content,
          cached: false,
          message: `Page loaded: "${page.title}"`,
        };
      }

      case 'extract_data': {
        const page = this.pageCache.get(params.url) || MOCK_PAGES[params.url];
        if (!page) {
          return { success: false, error: `Page not in cache: ${params.url}. Fetch it first.` };
        }
        const fields = params.field.split('.');
        let value = page.content;
        for (const f of fields) {
          if (value && typeof value === 'object' && f in value) {
            value = value[f];
          } else {
            return {
              success: false,
              error: `Field "${params.field}" not found`,
              available_fields: Object.keys(page.content),
            };
          }
        }
        return {
          success: true,
          field: params.field,
          value,
          type: typeof value,
          message: `Extracted ${params.field}: ${JSON.stringify(value)}`,
        };
      }

      case 'search_catalog': {
        const q = params.query.toLowerCase();
        const results = Object.values(MOCK_PAGES)
          .filter(p => JSON.stringify(p.content).toLowerCase().includes(q))
          .map(p => ({ title: p.title, url: p.url, summary: p.content.name || p.title }));
        return {
          success: true,
          query: params.query,
          results,
          count: results.length,
          message: `Found ${results.length} results for "${params.query}"`,
        };
      }

      case 'list_urls': {
        const urls = Object.entries(MOCK_PAGES).map(([url, page]) => ({
          url,
          title: page.title,
          type: page.metadata.type || page.metadata.category || 'product',
        }));
        return {
          success: true,
          urls,
          message: `${urls.length} pages available`,
        };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }
}
