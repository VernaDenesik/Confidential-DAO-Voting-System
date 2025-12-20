# FHEVM Secure Voting Examples

A comprehensive system for creating standalone Fully Homomorphic Encryption (FHEVM) voting example repositories with automated documentation generation and scaffolding tools.

[Video](https://youtu.be/hU3HWDZ_ORI)

[Live Demo](https://confidential-dao-voting-system.vercel.app/)

## 🎯 Overview

This project provides:

- **Base Template**: Complete Hardhat setup for FHEVM voting development
- **Example Contracts**: Production-ready voting contracts using FHE
- **Automation Tools**: TypeScript CLI tools to generate standalone repositories
- **Documentation Generator**: Auto-generate GitBook-formatted guides
- **Comprehensive Tests**: Full test coverage with detailed documentation

## ✨ Features

### Privacy-Preserving Voting

- Fully Homomorphic Encryption for encrypted vote aggregation
- Commit-reveal voting mechanism for privacy protection
- Weighted voting power system
- Double-vote prevention
- Gas-optimized operations

### Developer-Friendly

- Type-safe TypeScript tests
- NatSpec documentation on all functions
- Clear code comments explaining FHEVM patterns
- Comprehensive test suite with best practices
- Automated example generation

### Production-Ready

- Full error handling
- Access control mechanisms
- Emergency pause functionality
- Secure random nonce generation
- Audit-friendly code structure

## 📋 Quick Start

### Install Dependencies

```bash
npm install
```

### Generate an Example

Generate a standalone voting example:

```bash
npx ts-node scripts/create-fhevm-example.ts fhevm-voting ./my-voting-example
cd my-voting-example
npm install
npm test
```

### Generate Documentation

Generate GitBook-compatible documentation:

```bash
npx ts-node scripts/generate-docs.ts fhevm-voting
npx ts-node scripts/generate-docs.ts --all
```

### Run Tests on Base Template

```bash
cd base-template
npm install
npm run compile
npm test
```

## 📁 Project Structure

```
fhevm-secure-voting/
├── base-template/                  # Hardhat template (deployable)
│   ├── contracts/
│   │   └── FHEMVoting.sol          # Main voting contract
│   ├── test/
│   │   └── FHEMVoting.ts           # Comprehensive tests
│   ├── deploy/                      # Deployment scripts
│   ├── hardhat.config.ts           # Hardhat configuration
│   ├── package.json                # Dependencies
│   └── tsconfig.json               # TypeScript config
│
├── scripts/                         # Automation tools
│   ├── create-fhevm-example.ts     # Generate standalone repos
│   ├── generate-docs.ts            # Generate documentation
│   └── README.md                   # Scripts documentation
│
├── examples/                        # Generated documentation
│   ├── SUMMARY.md                  # GitBook index
│   └── *.md                        # Example guides
│
└── README.md                        # This file
```

## 🚀 Key Examples

### FHEVM Voting System

**fhevm-voting** - Privacy-preserving governance with encrypted vote tallying

Demonstrates:
- ✅ Encrypted vote aggregation using FHE.add
- ✅ Commit-reveal voting for privacy
- ✅ Weighted voting power
- ✅ Permission management (FHE.allow, FHE.allowThis)
- ✅ Access control and emergency functions

Generate with:
```bash
npx ts-node scripts/create-fhevm-example.ts fhevm-voting
```

## 🔑 Core Concepts

### FHEVM Encryption Model

FHEVM uses binding where encrypted values are bound to `[contract, user]` pairs:

1. **Value Encryption**: Encrypt votes locally, bound to specific contract/user
2. **Input Proofs**: Zero-knowledge proofs attest correct binding
3. **Permission System**: Both contract and user need FHE permissions

### Critical Patterns

**✅ DO: Grant Both Permissions**
```solidity
FHE.allowThis(encryptedVotes);        // Contract permission
FHE.allow(encryptedVotes, msg.sender); // User permission
```

**❌ DON'T: Forget allowThis**
```solidity
FHE.allow(encryptedVotes, msg.sender); // Missing allowThis - will fail!
```

**✅ DO: Use Commit-Reveal for Privacy**
```
Commit Phase: Submit hash(choice, nonce, voter)
Reveal Phase: Prove and tally actual vote
```

**❌ DON'T: Reveal votes directly**
```
Direct voting exposes choices - use commit-reveal instead
```

## 🧪 Testing

The base template includes comprehensive tests covering:

- ✅ Proposal lifecycle management
- ✅ Voting permissions and access control
- ✅ Vote commitment and reveal mechanism
- ✅ FHEVM encrypted operations
- ✅ Error handling and edge cases
- ✅ Weighted voting calculations
- ✅ Emergency pause functionality

Run tests:
```bash
cd base-template
npm test
```

With coverage:
```bash
npm run coverage
```

## 📚 Documentation

Auto-generated documentation includes:

- Concept explanations
- Code examples and patterns
- Test coverage details
- FHEVM-specific best practices
- Security considerations
- Deployment guides

Generate documentation:
```bash
npx ts-node scripts/generate-docs.ts fhevm-voting
```

## 🛠️ Automation Scripts

### create-fhevm-example.ts

Generates complete standalone repositories:

```bash
npx ts-node scripts/create-fhevm-example.ts <example> [output-dir]

Examples:
  npx ts-node scripts/create-fhevm-example.ts fhevm-voting ./voting-example
  npx ts-node scripts/create-fhevm-example.ts fhevm-voting  # Uses default dir
```

Creates:
- Cloned base template
- Copied contract and test files
- Updated configuration files
- Generated README and documentation
- Deployment scripts
- .gitignore and environment templates

### generate-docs.ts

Generates GitBook documentation from code:

```bash
npx ts-node scripts/generate-docs.ts [example-name]

Options:
  --all     Generate all examples
  --list    List available examples
  --help    Show help message

Examples:
  npx ts-node scripts/generate-docs.ts fhevm-voting
  npx ts-node scripts/generate-docs.ts --all
```

Generates:
- Markdown documentation per example
- SUMMARY.md for GitBook navigation
- Code examples and patterns
- Best practices and security notes
- Testing information
- Resources and links

## 🔐 Security Features

### Vote Privacy
- Encrypted vote aggregation
- Commit-reveal mechanism
- Only authorized users can access encrypted values

### Cryptographic Security
- Keccak-256 hashing for commitments
- Secure random nonce generation
- Hash verification prevents tampering

### Smart Contract Security
- Owner-only administrative functions
- State validation throughout phases
- Double-voting prevention
- Emergency pause functionality
- No fund custody (no reentrancy risk)

## 🚢 Deployment

### Local Testing

```bash
cd base-template
npx hardhat node
```

### Deploy to Sepolia Testnet

1. Create `.env`:
```env
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

2. Deploy:
```bash
cd base-template
npx hardhat run scripts/deploy.ts --network sepolia
```

3. Verify:
```bash
npx hardhat verify --network sepolia CONTRACT_ADDRESS
```

## 📖 Development Workflow

### Creating a Custom Example

1. **Clone Base Template**
```bash
npx ts-node scripts/create-fhevm-example.ts fhevm-voting ./my-custom-voting
```

2. **Modify Contracts**
```bash
cd my-custom-voting
# Edit contracts/FHEMVoting.sol
```

3. **Update Tests**
```bash
# Edit test/FHEMVoting.ts
npm test
```

4. **Add Documentation**
```bash
# Tests and comments generate documentation automatically
```

### Testing Your Modifications

```bash
cd base-template
npm run compile
npm test
npm run lint
npm run coverage
```

## 🎓 Learning Resources

### FHEVM Concepts

1. **Fully Homomorphic Encryption**: Encrypt data, compute on it, decrypt results
2. **Commit-Reveal Pattern**: Two-phase voting for privacy and integrity
3. **Encrypted Arithmetic**: FHE.add for accumulating encrypted votes
4. **Permission System**: FHE.allow controls decryption access

### External Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [Zama Community](https://www.zama.ai/community)
- [Zama Discord](https://discord.com/invite/zama)
- [Zama Blog](https://www.zama.ai/blog)

## 🤝 Contributing

Contributions are welcome! When adding examples:

1. **Follow existing patterns** and structure
2. **Include comprehensive comments** explaining FHEVM concepts
3. **Demonstrate both** correct usage and common pitfalls
4. **Update automation scripts** to include new examples
5. **Test generated standalone** repository thoroughly
6. **Verify documentation** renders correctly

## 📝 Best Practices

### For Smart Contract Development

- Always use both `FHE.allowThis()` and `FHE.allow()`
- Verify vote commitments before tallying
- Use cryptographically secure random nonces
- Document all FHEVM-specific patterns
- Test encrypted operations thoroughly

### For Testing

- Test success cases (✅) and failures (❌)
- Include edge cases and boundary conditions
- Use descriptive test names
- Comment complex test setups
- Verify event emissions

### For Documentation

- Use JSDoc/TSDoc comments
- Document FHEVM patterns clearly
- Include code examples
- Explain security implications
- Provide learning resources

## 📄 License

BSD-3-Clause-Clear License

All code in this repository is licensed under the BSD-3-Clause-Clear license, which is compatible with the GPL and free for personal and commercial use.

## 🙏 Acknowledgments

- **Zama Team**: For creating FHEVM and organizing the bounty program
- **OpenZeppelin**: For smart contract security patterns
- **Hardhat Team**: For excellent development framework
- **Ethereum Community**: For blockchain infrastructure

## 📞 Support & Community

- **GitHub Issues**: Report bugs and feature requests
- **Zama Community Forum**: https://www.zama.ai/community
- **Discord Server**: https://discord.com/invite/zama
- **Zama on Twitter**: https://twitter.com/zama

## ⚠️ Disclaimer

This software is experimental and provided "as is" without warranty. It is intended for educational and development purposes.

**Important Notes:**
- Contracts not audited for mainnet production use
- Always test thoroughly before deployment
- Users responsible for private key security
- Verify contract code before interaction
- No liability for losses from usage

---

**Built for the Zama FHEVM Bounty Program**

*Advancing privacy-preserving blockchain governance with Fully Homomorphic Encryption*

Generated with TypeScript automation and comprehensive documentation.
