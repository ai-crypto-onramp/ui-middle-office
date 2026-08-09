.PHONY: build test run lint typecheck docker-build docker-run clean

build:
	npm run build

test:
	npm test

run:
	npm run dev

lint:
	npm run lint

typecheck:
	npm run typecheck

docker-build:
	docker build -t ai-crypto-onramp/ui-middle-office .

docker-run:
	docker run --rm -p 3000:3000 ai-crypto-onramp/ui-middle-office

clean:
	rm -rf dist coverage node_modules