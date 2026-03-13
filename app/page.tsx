import type { Metadata } from "next"
import HomeClient from "./home-client"

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function formatSharedAtText(value: string | undefined) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} ${date.getHours()}h ${date.getMinutes()}m ${date.getSeconds()}s`
}

export const dynamic = "force-dynamic"

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams

  const wd = first(params.wd) ?? ""
  const hd = first(params.hd) ?? ""
  const sharedAt = first(params.sharedAt) ?? ""
  const v = first(params.v) ?? ""

  const urlParams = new URLSearchParams()
  if (wd) urlParams.set("wd", wd)
  if (hd) urlParams.set("hd", hd)
  if (sharedAt) urlParams.set("sharedAt", sharedAt)
  if (v) urlParams.set("v", v)

  const queryString = urlParams.toString()
  const pageUrl = queryString
    ? `https://countdown-00.vercel.app/?${queryString}`
    : "https://countdown-00.vercel.app/"

  const ogImageUrl = queryString
    ? `https://countdown-00.vercel.app/api/og?${queryString}`
    : "https://countdown-00.vercel.app/api/og"

  const sharedTimeText = formatSharedAtText(sharedAt)

  const title = "Life Countdown"
  const description = sharedTimeText
    ? `Visualize how you spend the remaining hours of the year. Shared at ${sharedTimeText}.`
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
      siteName: "Life Countdown",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Life Countdown preview",
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