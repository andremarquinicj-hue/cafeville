import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { gunzipSync } from "node:zlib";

/**
 * Cópia de recuperação das 105 artes SVG originais do CaféVille 0.4.
 * Origem: public/assets/game, gerado por scripts/create-assets.py.
 * Os dados abaixo contêm apenas as ilustrações; nenhuma chave ou configuração Firebase.
 *
 * O envio pelo site do GitHub pode deixar public incompleta ou dentro das
 * pastas dos lotes. No build/dev, restauramos somente imagens ausentes/vazias
 * no caminho público correto. Imagens existentes são preservadas.
 * A recuperação não roda no servidor de produção, cujo disco pode ser somente leitura.
 */
const CORE_ART_GZIP_BASE64 = [
  "H4sIAAAAAAACA+2dy27jSJaGXyVQuakChnbcL42aWkwtxosyZjHoXDXQ4DXlHsmyZSezOgfz7hOHsiQGRd1spVON/FEFpUSTjAhe",
  "/vPFiRMn/ven/OFhepffl/XTdTn/fP9cL66e2k8//eWnX+M/7M/Z9P7p3//20+T5+eEv19dfvny5+qKu5otP15Jzfh13+dtP7Mtd",
  "9TyJOwnL469Jffdp8kw/A/1s7+ov/zH/M/7mjLO4C+u2//ZrVTdPv/06vbuv88V/LvLqrr5/ZndV3PHLfF7FI/+UdNCVj1//SV8F",
  "HfX0PH9g9JGV8+l8ETd/qELITfzj9ctf503zVD8vDxjs6oPhsup2vU5LHq9Juajz2QlVaZomVPVRValCqUM4viqz+jmfrqoiDlWk",
  "rhpe2+OuSRWqoI6vyLTOmx2lep0HrY8qVRlb6Hy81If8OT6G9y+3YDp/nvQeMpk8Y92vl/3/en/3TM/q56d68d8PeVn/1/1fn2qq",
  "6qIun/edoLmbTl9un6nKrlLJIWL3IVXtjJVxwzyWePf8z7jtym2fIS1U9M9QNtYYm57BmuWVeWlZ/LZ8W+rp9O7hqWYlvU+ezlLS",
  "/sJRDRa00Rj61m3UvUJ0rZ0aVFMsn49YxoR1T5jwzHtmZaZE/GRKtJZPs+5b1m39ujnj58X05w/0ov7S3drF/H9qKsdZw5Vfb8rW",
  "7R8U5aMMSL4sqzXhpZTe+T8EaRo6U3KYNExwy7RhUrbKTjNtMqn6h5V10EandWp0I4vDdQpUp3hykUmxPLlgMqlTIVyuTXpyqXNZ",
  "Hj65sMwrZnWmZPxkSrZCxlbTt6zbmjTCFz4USTneuKp7zk4tZ1nG1/QpF+VSpHY8T16vHiel14+T6z/1VdkUfO8p1k+k9OtTqH4t",
  "4m2p1fAWCCa0Y9JkQibNr6tSuZHLvBQbskO//fRvfVvWLO6qTzVMGUwZTNkPaMqiBYs6sjRlyjLhWyFc1Nv4i2fKZcIPbVn3fqTG",
  "LGhXGLMtOkPVstFoGmYF2bJNMX3JrYuqKZrROiq3rF20N8N6fShcUeZhWFqINlAyEzIZbuMPG1rBXVLxXOUuHFFxF5hzrbAzHg1d",
  "K31qcaQrrd0+Se+89LSX+UPcuIhdh2oo5paZKJEqs7GC00xEs9RvXOU9f3lteuaLx9YJx0JmOgMZmOkf40TQVu3S/PhatpB8SD4k",
  "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",
  "bxKyb0+kLpTe7o0bW2uxXWM9pPfEkNCUGPcoM8MzyTMbyDDRlkxkxjIlM89Xm3RmdezprN6sT8Oe9Xoswot1x1olPb/nRX7/1MwX",
  "s64v8Jw/1z9TB9o45sUvm2p+Xkx//kAv5S/JLdG1q7U6ph8dT2h1S9foYJGb0+dFaWzYffqksYKv+yzOH99aHfvzPPZM/DlbS2e0",
  "YmdzkzJf2dzN42n48a31jCiHn7Ot8YRK7Wxqr8BXNtTo9XsoTnmKHSdlicec9TGO/dI9j3FS5qufY7FpsDq+wdbHh0rEwtV5n2TB",
  "gt3Z4rTQV7Z442zoRh+OvcGR8pSNlTtnc+MJXdh9f/tFvvb2ile11sp4kc/dWjrjnuYmZR7f3BXt17EHUD4/XT895Iv/eTXvd97L",
  "NdR0v1La17G/5MH6YH2w/umsv+FyqVlE8dh3ZiKiWtZ90M8sfu/+t92Pr2kP3+SpK7aZzuc0DB1fuNf38I3st83Z7Q6+iR0Ii3ce",
  "7zze+be8893gqbNZ9xm/Z91n/xWvfF47n77i8cW6LuItOJsLz+5w4Vm48PCK4xU/owtPrl0FXV2Wo/f98e88viS2SQvZ71/b9Mnt",
  "phMzuFhFXSU9iEqXJlcnDlkIsa68XnvhZH9Up5G1K4fD5qRtfOJ1q/VjphWTIvM6HVSpnJfWbR/n7aOOXSDD6IBWiHi8JAgaHh9b",
  "yMt8X93teqxEr697EncQT6GrYRW0ZSY8ZrKLa+GZFIRmFJ8TGzGl0BeRNkMYr4cDS7F3pALzkex8ZpKbYCqvdTHqnEwHtsTba+HU",
  "W2sRzNtrEdzrapFavsXdp7yq7xawf7B/sH+wfxdp/3ZE7wm+GbSXo5ERVVk2udsKxNucIoSXQLykaGe1kYNIvFkU2xCFP9Mzz3T3",
  "byaibkumMzGjILaXbbHfQZvSwAkTciuPukTLC/PSPv+69vXOEfzRDRScsyC/fQvd+up797r2bc7g3NHNs4FF4/8tWpdY1HIxv3t6",
  "OmdMCAwqDCoMKgzqt+lQUgckdkVMZhXTsSdBcdnkOxfM8mmXMYPiNpTJRIgCKaJymtSl5kst0xE1Y103CHogSjB2P72jSHahSIoz",
  "FbujgUk+i19F7NjQnI0oyzITcSeavhE7q677GrJYE8NCUmwjitLJXaGNiUbXTw+L+ukJfR5INCQaEn3hEh0ryBx/jBIc1ZGmrmeU",
  "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",
  "h7FlaN1wmSOa08E/GpsrTosULsuJysBbkyxxGFwpi3TwsK5L5w+vMUuLcknXejXLFM+kn9hUrH1llaq2T7O9ApHgdn2ZFd+sQbR5",
  "aFxZO5EsLbTU0mYKMYWYQkx/0NVjTbdwnskildnIayrrPg+rqBfGHbWYtyFptjaedJZpk+lYTuxuylkWVBZL1kylwV51VVSuOrRs",
  "6lK7nif1DEumQrugXT+OdvWpZ3NKvwp+Mv31FOu8kiEf+s8MrY76KHlmFDOK1nNWNnOcORp0bJW4EX1wci4UJh8BLrUq26yWcuyH",
  "g36oQ14aPiJa9AnNgmZBs34Yzerq+eeqjvSXro+2bvug6mq96G9fiOqqagqXQpgxbsyZZ4bTgWlBaDOJ5bTK3Ei+A++SY3R3TNx/",
  "JiMdjn9JK8ONUnoXEQ408O6+mn+BCkIFoYI/ngp2K4f/c1XZjQrqVAXNqih3sDfqpM4V3yWE64LVWn5lv2A+uGa2vyR3UZXVcAhW",
  "kWvQEEJqmuKc0UiHoe+WZ1FjjbtR/Qvv67y0ctv1RxnvhKRU495OBNdJk4rG170F89ZN2lpFwdJCL8p362w6fiPt15ngnvFJptxU",
  "+LhtIgZr08uy3B5UFkZOhI5V0jeibyGoJqWueyr+f/8PmQuXaswGAwA=",
].join("");

function ensureCoreArt(): void {
  const art = JSON.parse(
    gunzipSync(Buffer.from(CORE_ART_GZIP_BASE64, "base64")).toString("utf8"),
  ) as Record<string, unknown>;
  const base = join(process.cwd(), "public", "assets", "game");
  const allowedPath = /^(appliances|characters|decor|effects|floors|food|furniture|ui|walls)\/[a-z0-9_-]+\.svg$/;
  let restored = 0;

  for (const [relativePath, svg] of Object.entries(art)) {
    if (!allowedPath.test(relativePath) || typeof svg !== "string" || !svg.includes("<svg")) {
      throw new Error("CaféVille: arte de recuperação inválida.");
    }
    const destination = join(base, relativePath);
    if (existsSync(destination) && statSync(destination).size > 0) continue;
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, svg, "utf8");
    restored++;
  }

  if (restored) console.info(`[CaféVille] ${restored} imagens restauradas em public/assets/game.`);
}

export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_DEVELOPMENT_SERVER) {
    ensureCoreArt();
  }
  return { reactStrictMode: true };
}
