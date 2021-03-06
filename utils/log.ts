export const logDeployStart = (contract:string, signer:string) => {
  console.log(`Deploying ${contract} with deployer ${signer} ...`)
}

export const logDeployEnd = (contract:string, address:string) => {
  console.log(`Deployed ${contract} at address ${address}`);
}