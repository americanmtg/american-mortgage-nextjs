import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - List all blog posts
export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        orderBy: { published_at: 'desc' },
        skip,
        take: limit,
        include: {
          media: true,
          author_ref: {
            include: { photo: true },
          },
          blog_posts_key_takeaways: {
            orderBy: { order: 'asc' },
          },
        },
      }),
      prisma.blog_posts.count(),
    ])

    const items = posts.map(post => ({
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
    }))

    return successResponse({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return errorResponse('Failed to fetch blog posts')
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
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

    if (!title || !slug) {
      return errorResponse('Title and slug are required', 400)
    }

    // Check if slug already exists
    const existing = await prisma.blog_posts.findUnique({
      where: { slug },
    })
    if (existing) {
      return errorResponse('A post with this slug already exists', 400)
    }

    // Create post with key takeaways
    const post = await prisma.blog_posts.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content: content || null,
        author: author || null,
        author_id: authorId || null,
        featured_image_id: featuredImageId || null,
        published_at: publishedAt ? new Date(publishedAt) : new Date(),
        blog_posts_key_takeaways: keyTakeaways?.length ? {
          create: keyTakeaways.map((kt: { takeaway: string }, index: number) => ({
            id: uuidv4(),
            takeaway: kt.takeaway,
            order: index,
          })),
        } : undefined,
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
      createdAt: post.created_at,
    }, 201)
  } catch (error) {
    console.error('Error creating blog post:', error)
    return errorResponse('Failed to create blog post')
  }
}
