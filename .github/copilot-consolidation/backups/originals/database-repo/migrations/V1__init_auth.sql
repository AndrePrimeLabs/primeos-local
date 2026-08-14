📁 database-repo/
├── 📁 config/             # Environment variables and connection profiles
├── 📁 migrations/         # Incremental, version-controlled changes
│   ├── 📄 V1__init_auth.sql
│   └── 📄 V2__add_metrics.sql
├── 📁 schema/             # State-based blueprints of object types
│   ├── 📁 tables/         # Core data structures
│   ├── 📁 views/          # Virtual tables
│   ├── 📁 functions/      # Scalar and table functions
│   └── 📁 procedures/     # Executable business logic
├── 📁 seeds/              # Reference data and lookups
│   ├── 📁 dev/            # Mock data for testing
│   └── 📁 prod/           # Essential system codes
└── 📁 scripts/            # Database administrator utilities
