import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.union(v.literal("available"), v.literal("low-stock"), v.literal("out-of-stock"), v.literal("discontinued"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query;
    
    if (args.search) {
      query = ctx.db
        .query("inventoryItems")
        .withSearchIndex("search_inventory", (q) => q.search("name", args.search!));
    } else {
      query = ctx.db.query("inventoryItems");
    }

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const items = await query.collect();
    
    return Promise.all(
      items.map(async (item) => {
        const allocations = await ctx.db
          .query("inventoryAllocations")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .filter((q) => q.eq(q.field("returnedAt"), undefined))
          .collect();
        
        const allocatedQuantity = allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
        
        return {
          ...item,
          availableQuantity: item.quantity - allocatedQuantity,
          allocatedQuantity,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("inventoryItems") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item) return null;

    const allocations = await ctx.db
      .query("inventoryAllocations")
      .withIndex("by_item", (q) => q.eq("itemId", args.id))
      .collect();

    const activeAllocations = allocations.filter(alloc => !alloc.returnedAt);
    const allocatedQuantity = activeAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);

    return {
      ...item,
      availableQuantity: item.quantity - allocatedQuantity,
      allocatedQuantity,
      allocations: await Promise.all(
        allocations.map(async (alloc) => {
          const user = await ctx.db.get(alloc.allocatedBy);
          const project = alloc.projectId ? await ctx.db.get(alloc.projectId) : null;
          const task = alloc.taskId ? await ctx.db.get(alloc.taskId) : null;
          
          return {
            ...alloc,
            allocatedByName: user?.name || user?.email || "Unknown",
            projectName: project?.name || null,
            taskTitle: task?.title || null,
          };
        })
      ),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    category: v.string(),
    sku: v.string(),
    quantity: v.number(),
    minQuantity: v.number(),
    unitPrice: v.number(),
    supplier: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const status = args.quantity <= args.minQuantity 
      ? (args.quantity === 0 ? "out-of-stock" : "low-stock")
      : "available";

    return await ctx.db.insert("inventoryItems", {
      ...args,
      status,
      lastUpdated: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("inventoryItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    quantity: v.optional(v.number()),
    minQuantity: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
    supplier: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const item = await ctx.db.get(id);
    if (!item) throw new Error("Item not found");

    const newQuantity = updates.quantity ?? item.quantity;
    const newMinQuantity = updates.minQuantity ?? item.minQuantity;
    
    const status = newQuantity <= newMinQuantity 
      ? (newQuantity === 0 ? "out-of-stock" : "low-stock")
      : "available";

    await ctx.db.patch(id, {
      ...updates,
      status,
      lastUpdated: Date.now(),
    });
  },
});

export const allocate = mutation({
  args: {
    itemId: v.id("inventoryItems"),
    quantity: v.number(),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Check available quantity
    const allocations = await ctx.db
      .query("inventoryAllocations")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("returnedAt"), undefined))
      .collect();
    
    const allocatedQuantity = allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
    const availableQuantity = item.quantity - allocatedQuantity;

    if (args.quantity > availableQuantity) {
      throw new Error("Insufficient quantity available");
    }

    return await ctx.db.insert("inventoryAllocations", {
      itemId: args.itemId,
      projectId: args.projectId,
      taskId: args.taskId,
      quantity: args.quantity,
      allocatedBy: userId,
      allocatedAt: Date.now(),
      notes: args.notes,
    });
  },
});

export const returnAllocation = mutation({
  args: { allocationId: v.id("inventoryAllocations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.allocationId, {
      returnedAt: Date.now(),
    });
  },
});

export const categories = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const items = await ctx.db.query("inventoryItems").collect();
    const categories = [...new Set(items.map(item => item.category))];
    return categories.sort();
  },
});
