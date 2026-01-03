# Browser Vision MCP Server

A Model Context Protocol (MCP) server that provides browser automation and visual analysis capabilities using Playwright.

## Features

- **Navigate to URLs**: Load any webpage programmatically
- **Visual Analysis**: Analyze page content with different levels of detail (basic, detailed, layout, elements)
- **Screenshots**: Capture full-page or viewport screenshots
- **Page Content Extraction**: Get text, links, images, forms, and optionally HTML
- **Element Interaction**: Click elements and fill form fields
- **Page Scrolling**: Scroll in any direction with configurable amounts

## Installation

1. Clone or copy this server to your local machine
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

### Running the Server

The server runs on stdio and can be connected to any MCP-compatible client:

```bash
npm start
```

Or run directly with Node.js:
```bash
node dist/index.js
```

### Available Tools

#### 1. `navigate_to_url`
Navigate to a specific URL.

**Parameters:**
- `url` (string, required): The URL to navigate to

**Example:**
```json
{
  "name": "navigate_to_url",
  "arguments": {
    "url": "https://example.com"
  }
}
```

#### 2. `analyze_page_visual`
Analyze the current page visually and describe its content.

**Parameters:**
- `analysisType` (string, optional): Type of visual analysis
  - `"basic"`: Title, URL, viewport info (default)
  - `"detailed"`: Everything plus headings, links, images, forms
  - `"layout"`: Page dimensions and scroll info
  - `"elements"`: Interactive elements analysis

**Example:**
```json
{
  "name": "analyze_page_visual",
  "arguments": {
    "analysisType": "detailed"
  }
}
```

#### 3. `take_screenshot`
Take a screenshot of the current page.

**Parameters:**
- `fullPage` (boolean, optional): Take a full-page screenshot (default: false)
- `path` (string, optional): Optional path to save the screenshot

**Example:**
```json
{
  "name": "take_screenshot",
  "arguments": {
    "fullPage": true,
    "path": "page_screenshot.png"
  }
}
```

#### 4. `get_page_content`
Get the current page content.

**Parameters:**
- `includeHTML` (boolean, optional): Include raw HTML content (default: false)

**Example:**
```json
{
  "name": "get_page_content",
  "arguments": {
    "includeHTML": true
  }
}
```

#### 5. `click_element`
Click on a specific element by selector.

**Parameters:**
- `selector` (string, required): CSS selector of the element to click

**Example:**
```json
{
  "name": "click_element",
  "arguments": {
    "selector": "#submit-button"
  }
}
```

#### 6. `fill_form_field`
Fill a form field with text.

**Parameters:**
- `selector` (string, required): CSS selector of the form field
- `text` (string, required): Text to fill in the field

**Example:**
```json
{
  "name": "fill_form_field",
  "arguments": {
    "selector": "input[name='email']",
    "text": "user@example.com"
  }
}
```

#### 7. `scroll_page`
Scroll the page.

**Parameters:**
- `direction` (string, required): Direction to scroll
  - `"up"`, `"down"`, `"left"`, `"right"`
- `amount` (number, optional): Amount to scroll in pixels (default: 500)

**Example:**
```json
{
  "name": "scroll_page",
  "arguments": {
    "direction": "down",
    "amount": 1000
  }
}
```

## Integration with MCP Clients

### Claude Desktop

Add this to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "browser-vision": {
      "command": "node",
      "args": ["/path/to/browser-vision-server/dist/index.js"],
      "env": {}
    }
  }
}
```

### Other MCP Clients

Configure your MCP client to run the server executable and connect via stdio.

## Development

### Project Structure

```
browser-vision-server/
├── src/
│   └── index.js          # Main server implementation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Scripts

- `npm start`: Run the server
- `npm run build`: Compile TypeScript to JavaScript
- `npm run dev`: Run in development mode with auto-reload

### Dependencies

- `@modelcontextprotocol/sdk`: Core MCP SDK
- `playwright`: Browser automation library

## Error Handling

The server includes comprehensive error handling:
- Browser initialization failures
- Navigation errors
- Element interaction failures
- Invalid tool parameters

All errors are returned in a standardized format with descriptive messages.

## Security Considerations

- The server runs a headless browser that can navigate to any URL
- Be cautious when using this server with untrusted URLs
- Consider implementing URL whitelisting in production environments
- The browser runs with default security settings

## License

This project is provided as-is for educational and development purposes.

## Support

For issues, questions, or contributions, please refer to the documentation of your MCP client or the Model Context Protocol specification.