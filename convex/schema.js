import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        picture: v.string(),
        uid: v.string(),
        themeColor: v.optional(v.string())
    }),
    workspace: defineTable({
        messages: v.any(),
        fileData: v.optional(v.any()),
    }),
    planComments: defineTable({
        workspaceId: v.id("workspace"),
        textSelector: v.string(),
        comment: v.string(),
        author: v.string()
    }),
    visualComments: defineTable({
        workspaceId: v.id("workspace"),
        selectorPath: v.string(),
        xPercent: v.number(),
        yPercent: v.number(),
        comment: v.string(),
        author: v.string()
    })
});