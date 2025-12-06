import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const postId = parseInt(id)
    if (isNaN(postId)) {
      return errorResponse('Invalid post ID', 400)
    }

    const post = await prisma.blog_posts.findUnique({
      where: { id: postId },
      include: {
        media: true,
        author_ref: {
          include: { photo: true },
        },
        blog_posts_key_takeaways: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!post) {
      return errorResponse('Blog post not found', 404)
    }

    return successResponse({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.media ? {
        id: post.media.id,
        alt: post.media.alt,
        url: post.media.url,
        filename: post.media.filename,
      } : null,
      content: post.content,
      publishedAt: post.published_at,
      author: post.author,
      authorId: post.author_id,
      authorRef: post.author_ref ? {
        id: post.author_ref.id,
        name: post.author_ref.name,
        email: post.author_ref.email,
        phone: post.author_ref.phone,
        nmlsId: post.author_ref.nmls_id,
        bio: post.author_ref.bio,
        photoUrl: post.author_ref.photo?.url || null,
      } : null,
      keyTakeaways: post.blog_posts_key_takeaways.map(kt => ({
        id: kt.id,
        takeaway: kt.takeaway,
      })),
      updatedAt: post.updated_at,
      createdAt: post.created_at,
    })
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return errorResponse('Failed to fetch blog post')
  }
}

// PATCH - Update blog post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const postId = parseInt(id)
    if (isNaN(postId)) {
      return errorResponse('Invalid post ID', 400)
    }

    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      author,
      authorId,
      featuredImageId,
      keyTakeaways,
      publishedAt,
    } = body

    // Check if new slug conflicts with existing post
    if (slug) {
      const existing = await prisma.blog_posts.findFirst({
        where: {
          slug,
          NOT: { id: postId },
        },
      })
      if (existing) {
        return errorResponse('A post with this slug already exists', 400)
      }
    }

    // Update post
    const post = await prisma.blog_posts.update({
      where: { id: postId },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(author !== undefined && { author }),
        ...(authorId !== undefined && { author_id: authorId || null }),
        ...(featuredImageId !== undefined && { featured_image_id: featuredImageId }),
        ...(publishedAt !== undefined && { published_at: new Date(publishedAt) }),
        updated_at: new Date(),
      },
      include: {
        media: true,
        author_ref: {
          include: { photo: true },
        },
        blog_posts_key_takeaways: {
          orderBy: { order: 'asc' },
        },
      },
    })

    // Update key takeaways if provided
    if (keyTakeaways !== undefined) {
      // Delete existing takeaways
      await prisma.blog_posts_key_takeaways.deleteMany({
        where: { parent_id: postId },
      })

      // Create new takeaways
      if (keyTakeaways.length > 0) {
        await prisma.blog_posts_key_takeaways.createMany({
          data: keyTakeaways.map((kt: { takeaway: string }, index: number) => ({
            id: uuidv4(),
            parent_id: postId,
            takeaway: kt.takeaway,
            order: index,
          })),
        })
      }

      // Refetch to get updated takeaways
      const updatedPost = await prisma.blog_posts.findUnique({
        where: { id: postId },
        include: {
          media: true,
          author_ref: {
            include: { photo: true },
          },
          blog_posts_key_takeaways: {
            orderBy: { order: 'asc' },
          },
        },
      })

      return successResponse({
        id: updatedPost!.id,
        title: updatedPost!.title,
        slug: updatedPost!.slug,
        excerpt: updatedPost!.excerpt,
        featuredImage: updatedPost!.media ? {
          id: updatedPost!.media.id,
          alt: updatedPost!.media.alt,
          url: updatedPost!.media.url,
        } : null,
        content: updatedPost!.content,
        publishedAt: updatedPost!.published_at,
        author: updatedPost!.author,
        authorId: updatedPost!.author_id,
        authorRef: updatedPost!.author_ref ? {
          id: updatedPost!.author_ref.id,
          name: updatedPost!.author_ref.name,
          email: updatedPost!.author_ref.email,
          phone: updatedPost!.author_ref.phone,
          nmlsId: updatedPost!.author_ref.nmls_id,
          bio: updatedPost!.author_ref.bio,
          photoUrl: updatedPost!.author_ref.photo?.url || null,
        } : null,
        keyTakeaways: updatedPost!.blog_posts_key_takeaways.map(kt => ({
          id: kt.id,
          takeaway: kt.takeaway,
        })),
        updatedAt: updatedPost!.updated_at,
      })
    }

    return successResponse({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.media ? {
        id: post.media.id,
        alt: post.media.alt,
        url: post.media.url,
      } : null,
      content: post.content,
      publishedAt: post.published_at,
      author: post.author,
      authorId: post.author_id,
      authorRef: post.author_ref ? {
        id: post.author_ref.id,
        name: post.author_ref.name,
        email: post.author_ref.email,
        phone: post.author_ref.phone,
        nmlsId: post.author_ref.nmls_id,
        bio: post.author_ref.bio,
        photoUrl: post.author_ref.photo?.url || null,
      } : null,
      keyTakeaways: post.blog_posts_key_takeaways.map(kt => ({
        id: kt.id,
        takeaway: kt.takeaway,
      })),
      updatedAt: post.updated_at,
    })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Blog post not found', 404)
    }
    console.error('Error updating blog post:', error)
    return errorResponse('Failed to update blog post')
  }
}

// DELETE - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { id } = await params
    const postId = parseInt(id)
    if (isNaN(postId)) {
      return errorResponse('Invalid post ID', 400)
    }

    await prisma.blog_posts.delete({
      where: { id: postId },
    })

    return successResponse({ success: true, deletedId: postId })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Blog post not found', 404)
    }
    console.error('Error deleting blog post:', error)
    return errorResponse('Failed to delete blog post')
  }
}
