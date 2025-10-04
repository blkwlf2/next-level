import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal("planning"), v.literal("active"), v.literal("on-hold"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    budget: v.optional(v.number()),
    managerId: v.id("users"),
    clientName: v.optional(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_manager", ["managerId"])
    .index("by_status", ["status"])
    .searchIndex("search_projects", {
      searchField: "name",
      filterFields: ["status", "priority", "managerId"],
    }),

  tasks: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    status: v.union(v.literal("todo"), v.literal("in-progress"), v.literal("review"), v.literal("completed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    assigneeId: v.optional(v.id("users")),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    dependencies: v.array(v.id("tasks")),
    tags: v.array(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_assignee", ["assigneeId"])
    .index("by_status", ["status"])
    .index("by_project_and_status", ["projectId", "status"])
    .searchIndex("search_tasks", {
      searchField: "title",
      filterFields: ["projectId", "status", "assigneeId"],
    }),

  inventoryItems: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(),
    sku: v.string(),
    quantity: v.number(),
    minQuantity: v.number(),
    unitPrice: v.number(),
    supplier: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal("available"), v.literal("low-stock"), v.literal("out-of-stock"), v.literal("discontinued")),
    lastUpdated: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_sku", ["sku"])
    .index("by_status", ["status"])
    .searchIndex("search_inventory", {
      searchField: "name",
      filterFields: ["category", "status"],
    }),

  inventoryAllocations: defineTable({
    itemId: v.id("inventoryItems"),
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    quantity: v.number(),
    allocatedBy: v.id("users"),
    allocatedAt: v.number(),
    returnedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_item", ["itemId"])
    .index("by_project", ["projectId"])
    .index("by_task", ["taskId"])
    .index("by_allocated_by", ["allocatedBy"]),

  timeEntries: defineTable({
    taskId: v.id("tasks"),
    userId: v.id("users"),
    hours: v.number(),
    description: v.string(),
    date: v.number(),
    billable: v.boolean(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"]),

  comments: defineTable({
    projectId: v.optional(v.id("projects")),
    taskId: v.optional(v.id("tasks")),
    userId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
  })
    .index("by_project", ["projectId"])
    .index("by_task", ["taskId"])
    .index("by_parent", ["parentId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
