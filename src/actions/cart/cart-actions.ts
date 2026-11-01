"use server";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { SessionUser } from "@/types/auth";

export type CartItemDisplay = {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  price: number;
  unit: string | null;
  stock: number;
  isActive: boolean;
  shopName: string;
  shopDistrict: string | null;
  quantity: number;
  lineTotal: number;
  productType: string;
  specifications: any;
  isRental?: boolean;
  rentalMode?: "HOURLY" | "DAILY";
  rentalRate?: number;
  rentalDuration?: number;
  rentalAmount?: number;
  securityDeposit?: number;
  supportsHourly?: boolean;
  supportsDaily?: boolean;
};

export type CartSummary = {
  cartId: string;
  items: CartItemDisplay[];
  subtotal: number;
  totalItemCount: number;
  totalUniqueProducts: number;
  totalSecurityDeposit?: number;
  totalRentalAmount?: number;
};

async function getStoredRentalMode(productId: string): Promise<"HOURLY" | "DAILY" | null> {
  try {
    const cookieStore = await cookies();
    const val = cookieStore.get(`rental_mode_${productId}`)?.value;
    if (val === "HOURLY" || val === "DAILY") return val;
  } catch {
    // Non-request or test environment
  }
  return null;
}

async function setStoredRentalMode(productId: string, mode: "HOURLY" | "DAILY") {
  try {
    const cookieStore = await cookies();
    cookieStore.set(`rental_mode_${productId}`, mode, {
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // Non-request or test environment
  }
}

const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity / Duration must be at least 1"),
  rentalMode: z.enum(["HOURLY", "DAILY"]).optional(),
});

const updateQuantitySchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export async function getCart(): Promise<{ cart: CartSummary | null; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                shop: {
                  select: { id: true, name: true, district: true },
                },
                images: {
                  take: 1,
                  orderBy: { sortOrder: "asc" },
                  select: { imageUrl: true },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  shop: {
                    select: { id: true, name: true, district: true },
                  },
                  images: {
                    take: 1,
                    orderBy: { sortOrder: "asc" },
                    select: { imageUrl: true },
                  },
                },
              },
            },
          },
        },
      });
    }

    const defaultPlaceholder =
      "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80";

    let subtotal = 0;
    let totalRentalAmount = 0;
    let totalSecurityDeposit = 0;
    let totalItemCount = 0;

    const items: CartItemDisplay[] = await Promise.all(
      cart.items.map(async (item) => {
        const isRental = item.product.productType === "MACHINERY_RENTAL";
        const specs = (item.product.specifications as any) || {};

        if (isRental) {
          const storedMode = await getStoredRentalMode(item.productId);
          const hourlyRate = Number(specs.rentalHourlyRate) || 0;
          const dailyRate = Number(specs.rentalDailyRate) || 0;
          const deposit = Number(specs.securityDeposit) || 0;

          const mode: "HOURLY" | "DAILY" =
            storedMode === "HOURLY" && hourlyRate > 0
              ? "HOURLY"
              : dailyRate > 0
              ? "DAILY"
              : hourlyRate > 0
              ? "HOURLY"
              : "DAILY";

          const rate = mode === "HOURLY" ? hourlyRate : dailyRate;
          const duration = item.quantity;
          const rentalAmount = rate * duration;
          const lineTotal = rentalAmount + deposit;

          subtotal += lineTotal;
          totalRentalAmount += rentalAmount;
          totalSecurityDeposit += deposit;
          totalItemCount += duration;

          return {
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productSlug: item.product.slug,
            productImage: item.product.images[0]?.imageUrl || defaultPlaceholder,
            price: rate,
            unit: mode === "HOURLY" ? "hour" : "day",
            stock: item.product.stock,
            isActive: item.product.isActive,
            shopName: item.product.shop.name,
            shopDistrict: item.product.shop.district,
            quantity: duration,
            lineTotal,
            productType: item.product.productType,
            specifications: item.product.specifications,
            isRental: true,
            rentalMode: mode,
            rentalRate: rate,
            rentalDuration: duration,
            rentalAmount,
            securityDeposit: deposit,
            supportsHourly: hourlyRate > 0,
            supportsDaily: dailyRate > 0,
          };
        } else {
          const price = Number(item.product.price);
          const lineTotal = price * item.quantity;
          subtotal += lineTotal;
          totalItemCount += item.quantity;

          return {
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            productSlug: item.product.slug,
            productImage: item.product.images[0]?.imageUrl || defaultPlaceholder,
            price,
            unit: item.product.unit,
            stock: item.product.stock,
            isActive: item.product.isActive,
            shopName: item.product.shop.name,
            shopDistrict: item.product.shop.district,
            quantity: item.quantity,
            lineTotal,
            productType: item.product.productType,
            specifications: item.product.specifications,
            isRental: false,
          };
        }
      })
    );

    return {
      cart: {
        cartId: cart.id,
        items,
        subtotal,
        totalItemCount,
        totalUniqueProducts: items.length,
        totalSecurityDeposit,
        totalRentalAmount,
      },
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error retrieving farmer cart:", error);
    return { cart: null, error: "Unable to load your cart. Please try again." };
  }
}

export async function getCartCount(): Promise<number> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    if (!cart) return 0;

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  } catch {
    return 0;
  }
}

export async function addToCart(
  productId: string,
  requestedQuantity: number = 1,
  rentalMode?: "HOURLY" | "DAILY"
): Promise<{ success?: boolean; error?: string; message?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const parsed = addToCartSchema.safeParse({
      productId,
      quantity: requestedQuantity,
      rentalMode,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid product or quantity" };
    }

    const { quantity } = parsed.data;

    // Check product existence and active status
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return { error: "This product is currently unavailable." };
    }

    const isRental = product.productType === "MACHINERY_RENTAL";

    if (isRental) {
      const specs = (product.specifications as any) || {};
      const hourly = Number(specs.rentalHourlyRate) || 0;
      const daily = Number(specs.rentalDailyRate) || 0;

      if (hourly <= 0 && daily <= 0) {
        return { error: "No rental pricing configured for this machinery." };
      }

      let selectedMode = rentalMode;
      if (!selectedMode) {
        selectedMode = daily > 0 ? "DAILY" : "HOURLY";
      }

      if (selectedMode === "HOURLY" && hourly <= 0) {
        return { error: "Hourly rental is not available for this machinery." };
      }
      if (selectedMode === "DAILY" && daily <= 0) {
        return { error: "Daily rental is not available for this machinery." };
      }

      await setStoredRentalMode(product.id, selectedMode);
    } else {
      if (product.stock <= 0) {
        return { error: "This product is currently out of stock." };
      }
    }

    // Find or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    // Check if the item is already in the cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
    });

    let targetQuantity: number;
    if (isRental) {
      // For rental machinery, requested quantity is the selected duration
      targetQuantity = quantity;
    } else {
      const currentQtyInCart = existingItem ? existingItem.quantity : 0;
      targetQuantity = currentQtyInCart + quantity;

      if (targetQuantity > product.stock) {
        if (currentQtyInCart >= product.stock) {
          return { error: "Maximum available quantity reached in your cart." };
        }
        return {
          error: `Only ${product.stock} units are currently available (${currentQtyInCart} already in cart).`,
        };
      }
    }

    // Upsert CartItem
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: product.id,
        },
      },
      create: {
        cartId: cart.id,
        productId: product.id,
        quantity: targetQuantity,
      },
      update: {
        quantity: targetQuantity,
      },
    });

    revalidatePath("/farmer/cart");
    revalidatePath("/farmer/marketplace");

    return {
      success: true,
      message: isRental ? "Machinery rental added to your cart." : "Product added to your cart.",
    };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error adding to cart:", error);
    return { error: "We couldn't update your cart. Please try again." };
  }
}

export async function updateCartItemQuantity(
  cartItemId: string,
  newQuantity: number
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const parsed = updateQuantitySchema.safeParse({ cartItemId, quantity: newQuantity });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "Invalid quantity" };
    }

    const { quantity } = parsed.data;

    // Secure Ownership Check: Item must belong to user's cart
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!item || item.cart.userId !== userId) {
      return { error: "Cart item not found or unauthorized access." };
    }

    if (!item.product.isActive) {
      return { error: "This product is currently unavailable." };
    }

    const isRental = item.product.productType === "MACHINERY_RENTAL";

    if (!isRental && quantity > item.product.stock) {
      return { error: `Only ${item.product.stock} units are currently available.` };
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    revalidatePath("/farmer/cart");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating cart quantity:", error);
    return { error: "We couldn't update your cart. Please try again." };
  }
}

export async function updateCartItemRentalMode(
  cartItemId: string,
  newMode: "HOURLY" | "DAILY"
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!item || item.cart.userId !== userId) {
      return { error: "Cart item not found or unauthorized access." };
    }

    const specs = (item.product.specifications as any) || {};
    if (newMode === "HOURLY" && (!specs.rentalHourlyRate || Number(specs.rentalHourlyRate) <= 0)) {
      return { error: "Hourly rental is not available for this machine." };
    }
    if (newMode === "DAILY" && (!specs.rentalDailyRate || Number(specs.rentalDailyRate) <= 0)) {
      return { error: "Daily rental is not available for this machine." };
    }

    await setStoredRentalMode(item.productId, newMode);
    revalidatePath("/farmer/cart");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error updating rental mode:", error);
    return { error: "Failed to update rental mode." };
  }
}

export async function removeCartItem(
  cartItemId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      return { error: "Cart item not found or unauthorized access." };
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    revalidatePath("/farmer/cart");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error removing cart item:", error);
    return { error: "Failed to remove item from cart." };
  }
}

export async function clearCart(): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await requireRole("FARMER");
    const userSession = session.user as SessionUser;
    const userId = userSession.id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { success: true };
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    revalidatePath("/farmer/cart");
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    console.error("Error clearing cart:", error);
    return { error: "Failed to clear your cart. Please try again." };
  }
}

