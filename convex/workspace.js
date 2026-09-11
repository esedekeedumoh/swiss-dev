import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const CreateWorkspace = mutation({
    args:{
        messages:v.any(),
    },
    handler:async(ctx,args)=>{
        const workspaceId = await ctx.db.insert('workspace',{
            messages:args.messages
        });
        return workspaceId;
    }
})

export const GetWorkspace = query({ 
    args:{
        workspaceId:v.id('workspace')
    },
    handler:async(ctx,args)=>{
        const result = await ctx.db.get(args.workspaceId);
        return result;
    }
})

export const GetAllWorkspaces = query({
    handler: async(ctx) => {
        // Just fetch all workspaces, normally we would filter by user
        return await ctx.db.query('workspace').order("desc").take(50);
    }
});

export const UpdateWorkspace = mutation({
    args:{
        workspaceId:v.id('workspace'),
        messages:v.any(),
    },
    handler:async(ctx,args)=>{
        const result=await ctx.db.patch(args.workspaceId,{
            messages:args.messages
        });
        return result;
    }
})

export const UpdateFiles = mutation({
    args:{
        workspaceId:v.id('workspace'),
        files:v.any(),
    },
    handler:async(ctx,args)=>{
        const result=await ctx.db.patch(args.workspaceId,{
            fileData:args.files
        });
        return result;
    }
})

export const SavePlanComment = mutation({
    args: {
        workspaceId: v.id('workspace'),
        textSelector: v.string(),
        comment: v.string(),
        author: v.string()
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('planComments', {
            workspaceId: args.workspaceId,
            textSelector: args.textSelector,
            comment: args.comment,
            author: args.author
        });
    }
});

export const SaveVisualComment = mutation({
    args: {
        workspaceId: v.id('workspace'),
        selectorPath: v.string(),
        xPercent: v.number(),
        yPercent: v.number(),
        comment: v.string(),
        author: v.string()
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('visualComments', {
            workspaceId: args.workspaceId,
            selectorPath: args.selectorPath,
            xPercent: args.xPercent,
            yPercent: args.yPercent,
            comment: args.comment,
            author: args.author
        });
    }
});
