import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List published blog posts or get single post by slug (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    // If slug is provided, fetch single post
    if (slug) {
      const post = await prisma.blog_posts.findUnique({
        where: { slug },
        include: {
          media: true,
          author_ref: {
            include: {
              photo: true,
            },
          },
          blog_posts_key_takeaways: {
            orderBy: { order: 'asc' },
          },
        },
      })

      // Check if post exists and is published
      if (!post || !post.published_at || post.published_at > new Date()) {
        return NextResponse.json(
          { success: false, error: 'Post not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
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
          author: post.author_ref?.name || post.author,
          authorBio: post.author_ref?.bio || null,
          authorPhoto: post.author_ref?.photo?.url || null,
          keyTakeaways: post.blog_posts_key_takeaways.map(kt => ({ takeaway: kt.takeaway })),
        },
      })
    }

    // Otherwise, list posts with pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const skip = (page - 1) * limit

    // Build where clause for published posts with optional search
    const where: any = {
      published_at: {
        not: null,
        lte: new Date(), // Only show posts published in the past
      },
    }

    // Add search filter if provided
    if (search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        orderBy: { published_at: 'desc' },
        skip,
        take: limit,
        include: {
          media: true,
          author_ref: true,
          blog_posts_key_takeaways: {
            orderBy: { order: 'asc' },
            take: 3, // Only get first 3 takeaways for preview
          },
        },
      }),
      prisma.blog_posts.count({ where }),
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
      } : null,
      publishedAt: post.published_at,
      author: post.author_ref?.name || post.author,
      keyTakeaways: post.blog_posts_key_takeaways.map(kt => kt.takeaway),
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching public blog posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}
