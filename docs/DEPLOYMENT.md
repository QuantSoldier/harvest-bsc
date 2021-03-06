# Harvest Finance - BSC Deployments

## Deploying the Core Contracts - Mainnet

1. Follow the [../README.md] to install dependencies and build the latest contract artifacts

2. Deploy the `Storage` Contract

```
yarn mainnet:deploy --tags Storage
```

3. Deploy the `FeeRewardForwarder` Contract

```
yarn mainnet:deploy --tags Forwarder
```

4. Deploy the `Controller` Contract

```
yarn mainnet:deploy --tags Controller
```

5. Verify the contracts with the following commands using contract addresses from the previous steps

```
yarn mainnet:verify <STORAGE_ADDRESS>
yarn mainnet:verify <FORWARDER_ADDRESS> "<STORAGE_ADDRESS>" "<TOKEN_ADDRESS>"
yarn mainnet:verify <CONTROLLER_ADDRESS> "<STORAGE_ADDRESS>" "<FORWARDER_ADDRESS>"
```

6. Commit the mainnet deployment artifacts

```
git add deployments
git commit -m "Harvest - BSC Mainnet Deployment"
git push
```

## Deploying a PancakeChef Vault & Strategy

1. Add a deployment script for the given LP token
