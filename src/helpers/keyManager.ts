import { KeyManager, KeyManagerPlugins, KeyType } from "@stellar/wallet-sdk";
import { Keypair } from "stellar-sdk";
import { getNetworkConfig } from "helpers/getNetworkConfig";
import { store } from "config/store";

export interface CreateKeyManagerResponse {
  id: string;
  password: string;
  errorMessage?: string;
}

const createKeyManager = () => {
  const localKeyStore = new KeyManagerPlugins.LocalStorageKeyStore();
  localKeyStore.configure({ storage: localStorage });
  const { settings } = store.getState();

  const keyManager = new KeyManager({
    keyStore: localKeyStore,
    defaultNetworkPassphrase: getNetworkConfig(settings.isTestnet).network,
  });

  keyManager.registerEncrypter(KeyManagerPlugins.ScryptEncrypter);
  return keyManager;
};

export const storePrivateKey = async (secret: string) => {
  const keyPair = Keypair.fromSecret(secret);
  const keyManager = createKeyManager();
  const { settings } = store.getState();

  const result: CreateKeyManagerResponse = {
    id: "",
    password: "Stellar Development Foundation",
    errorMessage: undefined,
  };

  try {
    const metaData = await keyManager.storeKey({
      key: {
        type: KeyType.plaintextKey,
        publicKey: keyPair.publicKey(),
        privateKey: keyPair.secret(),
        network: getNetworkConfig(settings.isTestnet).network,
      },
      password: result.password,
      encrypterName: KeyManagerPlugins.ScryptEncrypter.name,
    });

    result.id = metaData.id;
  } catch (err) {
    result.errorMessage = err;
    return result;
  }

  return result;
};

export const loadPrivateKey = async (id: string, password: string) => {
  const keyManager = createKeyManager();
  let result;
  try {
    result = await keyManager.loadKey(id, password);
  } catch (err) {
    return err;
  }
  return result;
};
