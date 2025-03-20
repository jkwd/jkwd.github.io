up:
	docker compose up

lint:
	npx prettier . --check

lint-fix:
	npx prettier . --write