import { JsonRpcProvider } from "@ethersproject/providers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractTransaction } from "ethers";
import { Forwarder } from "../typechain";
import {
  ForwarderRequestType,
  signMetaTxRequestType,
  TypeddataType,
  capitalize,
  typedData,
  typedMessageInstance,
} from "./types";

export const EIP712Domain = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "nonce", type: "uint256" },
  { name: "method", type: "string" },
];

export const RequestTemplate = [
  { name: "tx", type: "ForwardRequest" },
  //will be decided dynamically
];

function getMetaTxTypeData(chainId: number, verifyingContract: string, method: string, arcana: Contract) {
  const Request = [...RequestTemplate];

  //check need to push or unshift
  // According to EIP712, Alphabetically arrange the type
  const customType = capitalize(method);
  if (Request[0].type.charAt(0) > customType.charAt(0)) Request.unshift({ name: "details", type: customType });
  else Request.push({ name: "details", type: customType });

  const mtypedata: any = {
    types: {
      EIP712Domain,
      ForwardRequest,
      Request,
    },
    domain: {
      name: "Arcana Forwarder",
      version: "0.0.1",
      chainId,
      verifyingContract,
    },
    primaryType: "Request",
  };

  mtypedata.types[capitalize(method)] = typedData(arcana, method);

  return mtypedata;
}

async function signTypedData(signer: SignerWithAddress, from: string, data: any): Promise<{ signature: string }> {
  // Note that hardhatvm and metamask require different EIP712 input
  const [method, argData] = ["eth_signTypedData_v4", JSON.stringify(data)];
  const signature = await (signer.provider as JsonRpcProvider).send(method, [from, argData]);
  return { signature };
}

async function buildRequest(forwarder: Forwarder, input: signMetaTxRequestType): Promise<ForwarderRequestType> {
  const nonce = await forwarder.getNonce(input.from).then((nonce: { toString: () => any }) => nonce.toString());
  return { nonce, ...input };
}

async function buildTypedData(
  forwarder: Forwarder,
  request: ForwarderRequestType,
  arcana: Contract,
  params: any[],
): Promise<TypeddataType> {
  const chainId = await forwarder.provider.getNetwork().then((n: { chainId: number }) => n.chainId);
  const typeData = getMetaTxTypeData(chainId, forwarder.address, request.method, arcana);

  //forward request
  typeData.message = {
    tx: {
      ...request,
    },
  };

  typeData.message.tx.method = capitalize(request.method);

  typeData.message.details = typedMessageInstance(arcana, request.method, params);

  return typeData;
}

export async function signMetaTxRequest(
  signer: SignerWithAddress,
  forwarder: Forwarder,
  arcana: Contract,
  params: any[],
  input: signMetaTxRequestType,
): Promise<{ signature: string; request: ForwarderRequestType }> {
  const request = await buildRequest(forwarder, input);
  const toSign = await buildTypedData(forwarder, request, arcana, params);
  const { signature } = await signTypedData(signer, input.from, toSign);
  return { signature, request };
}

export async function sign(
  signer: SignerWithAddress,
  arcana: Contract,
  forwarder: Forwarder,
  method: string,
  params: any[],
): Promise<ContractTransaction> {
  const { request, signature } = await signMetaTxRequest(signer, forwarder, arcana, params, {
    from: signer.address,
    to: arcana.address,
    method,
  });
  const callData = arcana.interface.encodeFunctionData(method, params);
  request.method = capitalize(method);

  const tx = await forwarder.execute(request, signature, callData, { gasPrice: 0 });
  await tx.wait();
  return tx;
}
