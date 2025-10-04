import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("on-hold"), v.literal("completed"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    let query;
    
    if (args.search) {
      query = ctx.db
        .query("projects")
        .withSearchIndex("search_projects", (q) => q.search("name", args.search!));
    } else {
      query = ctx.db.query("projects");
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const projects = await query.collect();
    
    return Promise.all(
      projects.map(async (project) => {
        const manager = await ctx.db.get(project.managerId);
        const taskCount = await ctx.db
          .query("tasks")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();
        
        const completedTasks = taskCount.filter(task => task.status === "completed").length;
        
        return {
          ...project,
          managerName: manager?.name || manager?.email || "Unknown",
          taskCount: taskCount.length,
          completedTasks,
          progress: taskCount.length > 0 ? Math.round((completedTasks / taskCount.length) * 100) : 0,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.id);
    if (!project) return null;

    const manager = await ctx.db.get(project.managerId);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();

    const completedTasks = tasks.filter(task => task.status === "completed").length;

    return {
      ...project,
      managerName: manager?.name || manager?.email || "Unknown",
      taskCount: tasks.length,
      completedTasks,
      progress: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("on-hold"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    clientName: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("projects", {
      ...args,
      managerId: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal("planning"), v.literal("active"), v.literal("on-hold"), v.literal("completed"))),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    clientName: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const project = await ctx.db.get(id);
    if (!project) throw new Error("Project not found");

    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.id);
    if (!project) throw new Error("Project not found");

    // Delete related tasks
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }

    await ctx.db.delete(args.id);
  },
});
