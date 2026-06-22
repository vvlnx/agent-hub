import wave2Pack from "../data/universe-wave2.json";
import { companyFromWaveSeed, type WaveSeedInput } from "./universe/templateSeed";

interface Wave2Pack {
  seeds: WaveSeedInput[];
}

export const COMPANY_UNIVERSE_WAVE2 = (wave2Pack as Wave2Pack).seeds.map(companyFromWaveSeed);
