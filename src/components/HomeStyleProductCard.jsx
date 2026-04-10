"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Heart, Star, ShoppingBag } from "lucide-react"
import { useWishlist } from "../context/WishlistContext"
import { useCart } from "../context/CartContext"
import { useLanguage } from "../context/LanguageContext"
import { getImageUrl } from "../utils/imageUtils"
import TranslatedText from "./TranslatedText"

const getStockPillClass = (status) => {
  const normalized = String(status || "").trim().toLowerCase()
  const isAvailable = normalized.includes("in stock") || normalized.includes("available") || normalized.includes("pre")
  if (isAvailable) return "border border-[#cbd6c4] bg-[#edf1eb] text-[#505e4d]"
  return "border border-slate-200 bg-slate-100 text-slate-600"
}

const FALLBACK_IMAGE_SRC = "/placeholder.svg"

const hasProductImage = (product) =>
  Boolean(
    (typeof product?.image === "string" && product.image.trim()) ||
      (Array.isArray(product?.galleryImages) && product.galleryImages.find((img) => typeof img === "string" && img.trim())) ||
      (Array.isArray(product?.images) && product.images.find((img) => typeof img === "string" && img.trim())),
  )

const HomeStyleProductCard = ({ product }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { getLocalizedPath } = useLanguage()
  const [imageFailed, setImageFailed] = useState(false)

  const imageExists = hasProductImage(product)
  const resolvedImageSrc = imageExists ? getImageUrl(product) : FALLBACK_IMAGE_SRC
  const shouldUseFallback = !imageExists || imageFailed
  const displayImageSrc = shouldUseFallback ? FALLBACK_IMAGE_SRC : resolvedImageSrc

  useEffect(() => {
    setImageFailed(false)
  }, [product?._id, product?.image])

  const stockStatus = product.stockStatus || (product.countInStock > 0 ? "In Stock" : "Out of Stock")
  const normalizedStock = String(stockStatus || "").trim().toLowerCase()
  const hasPositiveStock = Number(product.countInStock) > 0
  const isExplicitOut =
    normalizedStock.includes("out of stock") ||
    normalizedStock.includes("stock out") ||
    normalizedStock.includes("sold out") ||
    normalizedStock.includes("unavailable")
  const isExplicitAvailable =
    normalizedStock.includes("in stock") ||
    normalizedStock.includes("available") ||
    normalizedStock.includes("preorder") ||
    normalizedStock.includes("pre-order") ||
    normalizedStock.includes("pre order")
  const isAvailable = isExplicitAvailable || (!isExplicitOut && hasPositiveStock)

  const basePrice = Number(product.price) || 0
  const offerPrice = Number(product.offerPrice) || 0
  const hasValidOffer = offerPrice > 0 && basePrice > 0 && offerPrice < basePrice
  const priceToShow = hasValidOffer ? offerPrice : basePrice > 0 ? basePrice : offerPrice

  const explicitDiscount = Number(product.discount) || 0
  const computedDiscount = hasValidOffer ? Math.round(((basePrice - offerPrice) / basePrice) * 100) : 0
  const discountValue = explicitDiscount > 0 ? explicitDiscount : computedDiscount

  const rating = Number(product.rating) || 0
  const numReviews = Number(product.numReviews) || 0
  const categoryName =
    (typeof product.category === "string" ? product.category : product.category?.name) ||
    (typeof product.parentCategory === "string" ? product.parentCategory : product.parentCategory?.name) ||
    (typeof product.subcategory === "string" ? product.subcategory : product.subcategory?.name) ||
    (typeof product.subCategory === "string" ? product.subCategory : product.subCategory?.name) ||
    product.categoryName ||
    "Unknown"
  const categorySourceDoc =
    (product.category && typeof product.category === "object" && product.category) ||
    (product.parentCategory && typeof product.parentCategory === "object" && product.parentCategory) ||
    (product.subcategory && typeof product.subcategory === "object" && product.subcategory) ||
    (product.subCategory && typeof product.subCategory === "object" && product.subCategory) ||
    null

  return (
    <article className="group flex h-[302px] sm:h-[370px] flex-col overflow-hidden rounded-xl border border-[#d7ddd4] bg-white p-2.5 sm:p-3 transition-colors duration-200 hover:border-[#b8c2b3]">
      <div className="mb-1.5 sm:mb-2">
        <Link to={getLocalizedPath(`/product/${encodeURIComponent(product.slug || product._id)}`)} className="block">
          <div className={`flex h-[100px] sm:h-[138px] items-center justify-center rounded-lg p-1.5 sm:p-2 ${shouldUseFallback ? "bg-[#f4f6f3]" : "bg-white"}`}>
            <img
              src={displayImageSrc}
              alt="Product image"
              className="h-full w-full object-contain"
              onError={(e) => {
                if (!shouldUseFallback) {
                  setImageFailed(true)
                  e.currentTarget.src = FALLBACK_IMAGE_SRC
                }
              }}
            />
          </div>
        </Link>
      </div>

      <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold ${getStockPillClass(stockStatus)}`}>
            <TranslatedText text={stockStatus} sourceDoc={product} fieldName="stockStatus" />
          </span>
          {discountValue > 0 && (
            <span className="whitespace-nowrap rounded-full bg-[#505e4d] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-white">
              {discountValue}% Off
            </span>
          )}
        </div>

        <button
          className="inline-flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border border-[#d3d8d0] bg-white text-[#e35f75] transition-colors hover:bg-rose-50"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            isInWishlist(product._id) ? removeFromWishlist(product._id) : addToWishlist(product)
          }}
          aria-label={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={13} className={isInWishlist(product._id) ? "fill-[#e35f75] text-[#e35f75]" : "text-[#e35f75]"} />
        </button>
      </div>

      <Link to={getLocalizedPath(`/product/${encodeURIComponent(product.slug || product._id)}`)} className="mb-0.5 block">
        <h3
          className="min-h-[36px] sm:min-h-[40px] text-[13px] sm:text-sm font-semibold leading-[1.15rem] sm:leading-5 tracking-tight text-slate-900 transition-colors group-hover:text-[#505e4d]"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          <TranslatedText text={product.name} sourceDoc={product} fieldName="name" />
        </h3>
      </Link>

      <div className="mb-0.5 min-h-[14px] sm:min-h-[16px] truncate text-[10px] sm:text-[11px] text-slate-500">
        <TranslatedText>Category</TranslatedText>:{" "}
        <span className="font-medium text-slate-700">
          {categorySourceDoc ? (
            <TranslatedText text={categoryName} sourceDoc={categorySourceDoc} fieldName="name" />
          ) : (
            <TranslatedText text={categoryName} />
          )}
        </span>
      </div>

      <div className="mb-0 text-[10px] sm:text-[11px] text-[#505e4d]">
        <TranslatedText>Inclusive VAT</TranslatedText>
      </div>

      <div className="mt-0.5 mb-0 flex items-end gap-1.5 sm:gap-2">
        <div className="text-[15px] sm:text-base font-bold leading-none text-[#1f2a1d] whitespace-nowrap">
          {Number(priceToShow).toLocaleString(undefined, { minimumFractionDigits: 2 })} <TranslatedText>AED</TranslatedText>
        </div>
        {hasValidOffer && (
          <div className="pb-0.5 text-[11px] sm:text-xs font-medium text-slate-400 line-through whitespace-nowrap">
            {Number(basePrice).toLocaleString(undefined, { minimumFractionDigits: 2 })} <TranslatedText>AED</TranslatedText>
          </div>
        )}
      </div>

      <div className="mb-1.5 sm:mb-2 flex min-h-[16px] sm:min-h-[18px] items-center">
        <div className="flex items-center gap-0.5 leading-none">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              strokeWidth={1.9}
              className={`block ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "fill-white text-slate-400"}`}
            />
          ))}
        </div>
        <span className="ml-1 text-[10px] sm:text-xs text-slate-500">({numReviews})</span>
      </div>

      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.style.transform = "scale(0.98)"
          setTimeout(() => {
            if (e.currentTarget) e.currentTarget.style.transform = "scale(1)"
          }, 100)
          addToCart(product)
        }}
        className="inline-flex w-full items-center justify-center gap-1.5 sm:gap-2 rounded-lg border border-[#505e4d] bg-[#505e4d] px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-semibold tracking-tight text-white transition-colors hover:bg-[#465342] disabled:cursor-not-allowed disabled:bg-slate-400"
        style={{ backgroundColor: "#505e4d", borderColor: "#505e4d" }}
        disabled={!isAvailable}
      >
        <ShoppingBag size={12} />
        <TranslatedText>Add to Cart</TranslatedText>
      </button>
    </article>
  )
}

export default HomeStyleProductCard
