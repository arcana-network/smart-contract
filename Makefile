.PHONY: help deploy-contract build-container create-network clean
help:
	@echo "deploy - deploys smart contract on local network"
	@echo "clean - cleans everything"

deploy-contract: build-container
	@echo "Waiting for smart contract to deploy..."
	@docker run --rm --network arcana arcana-smart-contract > out.txt
	@echo "Please find output in out.txt"

build-container:
	@echo "Building container..."
	@docker build -t arcana-smart-contract .
	@echo "Done"

create-network:
	@echo "Creating network..."
	@docker network create arcana
	@echo "Done"

clean:
	@echo "Cleaning..."
	@rm out.txt && docker image rm arcana-smart-contract
	@echo "Cleaned"

deploy:
	@(make create-network && make deploy-contract) || make deploy-contract
