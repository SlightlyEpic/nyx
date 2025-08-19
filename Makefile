bot:
	cd packages/db
	pnpm build
	cd ../..
	cd apps/bot
	pnpm build

web:
	cd packages/db
	pnpm build
	cd ../..
	cd apps/web
	pnpm build
