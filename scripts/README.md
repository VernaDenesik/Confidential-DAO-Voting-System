# Automation Scripts

This directory contains TypeScript-based CLI tools for generating FHEVM voting examples and documentation.

## Available Scripts

### 1. create-fhevm-example.ts

Generates complete standalone FHEVM example repositories.

**Purpose**: Clone the base template and create a ready-to-use example project with:
- Contract and test files
- Configuration files
- README and documentation
- Deployment scripts
- Environment templates

**Usage**:
```bash
# Using npm scripts (recommended)
npm run create-example <example-name> [output-dir]

# Direct execution
npx ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
```

**Examples**:
```bash
# Generate voting example in default location
npm run create-example fhevm-voting

# Generate voting example in specific directory
npm run create-example fhevm-voting ./my-voting-project

# Get help
npm run help:create
```

**Available Examples**:
- `fhevm-voting` - Privacy-preserving voting with FHEVM encryption

**Output Structure**:
```
output-dir/
├── contracts/
│   └── FHEMVoting.sol
├── test/
│   └── FHEMVoting.ts
├── scripts/
│   └── deploy.ts
├── hardhat.config.ts
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

**What It Does**:
1. ✅ Copies base template structure
2. ✅ Includes contracts and tests
3. ✅ Generates custom README
4. ✅ Creates deployment scripts
5. ✅ Sets up environment files
6. ✅ Configures package.json

**Next Steps After Generation**:
```bash
cd output-dir
npm install
npm run compile
npm test
```

### 2. generate-docs.ts

Generates GitBook-compatible documentation from code comments and structure.

**Purpose**: Auto-generate markdown documentation including:
- Contract explanations
- FHEVM pattern documentation
- Test coverage details
- Best practices
- Security notes
- Resource links

**Usage**:
```bash
# Using npm scripts (recommended)
npm run generate-docs <example-name>
npm run generate-docs --all

# Direct execution
npx ts-node scripts/generate-docs.ts <example-name>
npx ts-node scripts/generate-docs.ts --all
```

**Examples**:
```bash
# Generate docs for specific example
npm run generate-docs fhevm-voting

# Generate docs for all examples
npm run generate-docs -- --all

# Get help
npm run help:docs
```

**Output Structure**:
```
examples/
├── fhevm-voting.md       # Example documentation
└── SUMMARY.md            # GitBook index (when using --all)
```

**Documentation Includes**:
- 📚 Overview and key concepts
- 💻 Smart contract details
- 🧪 Testing information
- 🔐 Security considerations
- ✅ Best practices
- 🔗 Resource links
- 🚀 Quick start guide

**Generated Documentation Sections**:
1. Overview
2. Key Concepts
3. Smart Contract Details
4. Testing Coverage
5. FHEVM Patterns
6. Security Considerations
7. Best Practices
8. Quick Start
9. Resources

### 3. Common Operations

**List Available Examples**:
```bash
npm run create-example -- --list
npm run generate-docs -- --list
```

**Show Help**:
```bash
npm run help:create
npm run help:docs
```

## Script Development

### Adding a New Example

To add a new example to the automation scripts:

1. **Create Contract**: Add contract to `base-template/contracts/`
2. **Create Tests**: Add tests to `base-template/test/`
3. **Update create-fhevm-example.ts**:
   ```typescript
   const EXAMPLES_MAP: Record<string, ExampleConfig> = {
       // ... existing examples ...
       'new-example': {
           contract: 'base-template/contracts/NewContract.sol',
           test: 'base-template/test/NewContract.ts',
           description: 'Description of what it demonstrates'
       }
   };
   ```

4. **Update generate-docs.ts**:
   ```typescript
   const DOCS_CONFIG: Record<string, DocConfig> = {
       // ... existing docs ...
       'new-example': {
           name: 'Example Title',
           description: 'Example description',
           contractFile: 'base-template/contracts/NewContract.sol',
           testFile: 'base-template/test/NewContract.ts',
           category: 'Category Name'
       }
   };
   ```

5. **Test Generation**:
   ```bash
   npm run create-example new-example ./test-output
   cd test-output
   npm install && npm test
   ```

### Script Architecture

Both scripts follow this pattern:

```typescript
// 1. Parse command-line arguments
const args = process.argv.slice(2);

// 2. Show help if requested
if (args.includes('--help')) {
    showHelp();
    process.exit(0);
}

// 3. Validate input
if (!EXAMPLES_MAP[exampleName]) {
    error(`Unknown example: ${exampleName}`);
}

// 4. Execute main functionality
try {
    // Generate files
    // Copy templates
    // Create documentation
    success('Operation completed!');
} catch (err) {
    error(`Operation failed: ${err}`);
}
```

### Error Handling

Scripts include comprehensive error handling:

- ✅ Input validation
- ✅ File existence checks
- ✅ Clear error messages
- ✅ Helpful suggestions
- ✅ Exit codes (0 = success, 1 = error)

### Color-Coded Output

Scripts use color-coded terminal output for clarity:

- 🟢 Green: Success messages
- 🔵 Blue: Information
- 🟡 Yellow: Warnings
- 🔴 Red: Errors

## Testing Scripts

### Manual Testing

Test script functionality:

```bash
# Test example generation
npm run create-example fhevm-voting ./test-voting
cd test-voting
npm install
npm test
cd ..

# Test documentation generation
npm run generate-docs fhevm-voting
cat examples/fhevm-voting.md
```

### Validation Checklist

Before committing script changes:

- [ ] Scripts run without errors
- [ ] Help messages are clear
- [ ] Error messages are helpful
- [ ] Generated examples compile
- [ ] Generated tests pass
- [ ] Documentation is well-formatted
- [ ] No hardcoded paths
- [ ] Cross-platform compatibility

## Troubleshooting

### Issue: "Unknown example"

**Solution**: Check example name matches configuration:
```bash
npm run create-example -- --list
```

### Issue: "Permission denied"

**Solution**: Ensure scripts are executable:
```bash
chmod +x scripts/*.ts
```

### Issue: "Cannot find module"

**Solution**: Install dependencies:
```bash
npm install
```

### Issue: Generated example doesn't compile

**Solution**: Verify base template compiles first:
```bash
cd base-template
npm install
npm run compile
```

## Best Practices

### When Writing Scripts

1. **Clear Help Messages**: Users should understand usage immediately
2. **Validation First**: Validate all inputs before processing
3. **Informative Output**: Log what the script is doing
4. **Error Recovery**: Provide suggestions when errors occur
5. **Cross-Platform**: Use path.join(), avoid shell-specific commands

### When Adding Examples

1. **Complete Documentation**: Include NatSpec on all functions
2. **Comprehensive Tests**: Cover success, failure, and edge cases
3. **Clear Descriptions**: Explain what FHEVM concepts are demonstrated
4. **Realistic Use Cases**: Show practical applications
5. **Security Notes**: Document security considerations

## Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js File System API](https://nodejs.org/api/fs.html)
- [Commander.js](https://github.com/tj/commander.js/) (for complex CLI)

---

**For Questions**: Open an issue or contact the development team.

**Happy Automating!** 🤖
