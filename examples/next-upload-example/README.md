This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, setup your `.env` file. The example works out of the box.

```bash
cp .env.example .env
```

Second, start Docker by running

```bash
docker-compose up -d
```

Finally, install dependencies and run the development server:

```bash
npm install && npm run dev
# or
yarn install && yarn dev
# or
pnpm install && pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to access the example.

To view the uploaded files navigate to the Minio instance created by Docker at [http://localhost:9001](http://localhost:9001) with your browser. The default credentials are `root` and `password`.