import { NextRequest } from 'next/server'
import { requireAuth, errorResponse, successResponse } from '@/lib/api-auth'
import prisma from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// GET - Get footer settings (public for frontend)
export async function GET() {
  try {
    const footer = await prisma.footer.findFirst({
      include: {
        footer_columns: {
          orderBy: { order: 'asc' },
          include: {
            footer_columns_links: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!footer) {
      return successResponse(null)
    }

    return successResponse({
      id: footer.id,
      tagline: footer.tagline,
      copyrightText: footer.copyright_text,
      nmlsInfo: footer.nmls_info,
      ctaText: footer.cta_text,
      ctaButtonText: footer.cta_button_text,
      ctaButtonUrl: footer.cta_button_url,
      columns: footer.footer_columns.map(col => ({
        id: col.id,
        title: col.title,
        links: col.footer_columns_links.map(link => ({
          id: link.id,
          label: link.label,
          url: link.url,
          openInNewTab: link.open_in_new_tab || false,
        })),
      })),
      updatedAt: footer.updated_at,
    })
  } catch (error) {
    console.error('Error fetching footer:', error)
    return errorResponse('Failed to fetch footer')
  }
}

// PUT - Update footer settings
export async function PUT(request: NextRequest) {
  const auth = await requireAuth()
  if (!auth.authenticated) return auth.response

  try {
    const body = await request.json()
    const {
      tagline,
      copyrightText,
      nmlsInfo,
      ctaText,
      ctaButtonText,
      ctaButtonUrl,
      columns,
    } = body

    const existing = await prisma.footer.findFirst()

    let footer
    if (existing) {
      // Update footer base fields
      footer = await prisma.footer.update({
        where: { id: existing.id },
        data: {
          ...(tagline !== undefined && { tagline }),
          ...(copyrightText !== undefined && { copyright_text: copyrightText }),
          ...(nmlsInfo !== undefined && { nmls_info: nmlsInfo }),
          ...(ctaText !== undefined && { cta_text: ctaText }),
          ...(ctaButtonText !== undefined && { cta_button_text: ctaButtonText }),
          ...(ctaButtonUrl !== undefined && { cta_button_url: ctaButtonUrl }),
          updated_at: new Date(),
        },
      })

      // Update columns if provided
      if (columns !== undefined) {
        // Delete all existing columns and links (cascade delete handles links)
        await prisma.footer_columns.deleteMany({
          where: { parent_id: existing.id },
        })

        // Create new columns with links
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const col = columns[colIndex]
          const columnId = uuidv4()

          await prisma.footer_columns.create({
            data: {
              id: columnId,
              parent_id: existing.id,
              title: col.title,
              order: colIndex,
              footer_columns_links: col.links?.length ? {
                create: col.links.map((link: any, linkIndex: number) => ({
                  id: uuidv4(),
                  label: link.label,
                  url: link.url,
                  open_in_new_tab: link.openInNewTab || false,
                  order: linkIndex,
                })),
              } : undefined,
            },
          })
        }
      }

      // Refetch with columns
      footer = await prisma.footer.findFirst({
        where: { id: existing.id },
        include: {
          footer_columns: {
            orderBy: { order: 'asc' },
            include: {
              footer_columns_links: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      })
    } else {
      // Create new footer
      footer = await prisma.footer.create({
        data: {
          tagline: tagline || 'Making homeownership possible for everyone.',
          copyright_text: copyrightText || null,
          nmls_info: nmlsInfo || null,
          cta_text: ctaText || 'See what home loan is right for you',
          cta_button_text: ctaButtonText || 'Start Here',
          cta_button_url: ctaButtonUrl || '/apply',
        },
      })

      // Create columns if provided
      if (columns?.length) {
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const col = columns[colIndex]
          const columnId = uuidv4()

          await prisma.footer_columns.create({
            data: {
              id: columnId,
              parent_id: footer.id,
              title: col.title,
              order: colIndex,
              footer_columns_links: col.links?.length ? {
                create: col.links.map((link: any, linkIndex: number) => ({
                  id: uuidv4(),
                  label: link.label,
                  url: link.url,
                  open_in_new_tab: link.openInNewTab || false,
                  order: linkIndex,
                })),
              } : undefined,
            },
          })
        }
      }

      // Refetch with columns
      footer = await prisma.footer.findFirst({
        where: { id: footer.id },
        include: {
          footer_columns: {
            orderBy: { order: 'asc' },
            include: {
              footer_columns_links: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      })
    }

    return successResponse({
      id: footer!.id,
      tagline: footer!.tagline,
      copyrightText: footer!.copyright_text,
      nmlsInfo: footer!.nmls_info,
      ctaText: footer!.cta_text,
      ctaButtonText: footer!.cta_button_text,
      ctaButtonUrl: footer!.cta_button_url,
      columns: footer!.footer_columns?.map(col => ({
        id: col.id,
        title: col.title,
        links: col.footer_columns_links.map(link => ({
          id: link.id,
          label: link.label,
          url: link.url,
          openInNewTab: link.open_in_new_tab || false,
        })),
      })) || [],
      updatedAt: footer!.updated_at,
    })
  } catch (error) {
    console.error('Error updating footer:', error)
    return errorResponse('Failed to update footer')
  }
}
