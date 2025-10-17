This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Poject Stucture
```
student-performance/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── students/
│   │   ├── page.tsx                # Student list + search
│   │   ├── [admNo]/page.tsx        # Single student editor
│   └── api/
│       ├── load-learning-areas/
│       │   └── route.ts            # GET - Load all learning areas
│       └── update-student/
│           └── route.ts            # POST - Push updates to Sheets
│
├── components/
│   ├── EditableTable.tsx           # Strand/Sub-strand dropdown grid
│   ├── LearningAreaCard.tsx        # Per-learning-area editing card
│   ├── StudentSearch.tsx           # Search bar + student selector
│   ├── ToastProvider.tsx           # React-toastify setup
│   └── LoadingSpinner.tsx
│
├── lib/
│   ├── googleSheets.ts             # Google API auth + helpers
│   ├── parsing.ts                  # Ported parse_learning_area logic
│   ├── normalization.ts            # normalize_val_* utilities
│   ├── scoring.ts                  # score_to_num, num_to_score, total calc
│   ├── types.ts                    # All shared TypeScript types
│   └── config.ts                   # Config and constants
│
├── public/
│   └── learning_area_links.json    # URLs for each Google Sheet tab
│
├── .env.local                      # Google credentials
├── package.json
├── tsconfig.json
└── README.md
```