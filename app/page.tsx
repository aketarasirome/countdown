import type { Metadata } from "next"
import HomeClient from "./home-client"

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export const dynamic = "force-dynamic"

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams

  const wd = first(params.wd) ?? ""
  const hd = first(params.hd) ?? ""
  const sharedAtMs = first(params.sharedAtMs) ?? ""
  const tzOffset = first(params.tzOffset) ?? ""
  const sharedLabel = first(params.sharedLabel) ?? ""
  const v = first(params.v) ?? ""

  const urlParams = new URLSearchParams()
  if (wd) urlParams.set("wd", wd)
  if (hd) urlParams.set("hd", hd)
  if (sharedAtMs) urlParams.set("sharedAtMs", sharedAtMs)
  if (tzOffset) urlParams.set("tzOffset", tzOffset)
  if (sharedLabel) urlParams.set("sharedLabel", sharedLabel)
  if (v) urlParams.set("v", v)

  const queryString = urlParams.toString()

  const pageUrl = queryString
    ? `https://countdown-00.vercel.app/?${queryString}`
    : "https://countdown-00.vercel.app/"

  const ogImageUrl = queryString
    ? `https://countdown-00.vercel.app/api/og?${queryString}`
    : "https://countdown-00.vercel.app/api/og"

  const title = "Countdown Clock"
  const description = sharedLabel
    ? `Visualize how you spend the remaining hours of the year. Shared at ${sharedLabel}.`
    : "Visualize how you spend the remaining hours of the year."

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: "Countdown Clock",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Countdown Clock preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default function Page() {
  return <HomeClient />
}