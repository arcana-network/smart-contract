import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { HardhatUserConfig } from "hardhat/config";

export interface Signers {
  admin: SignerWithAddress;
}

export interface HardhatConfig extends HardhatUserConfig {
  etherscan?: {
    apiKey: string;
  };
}
