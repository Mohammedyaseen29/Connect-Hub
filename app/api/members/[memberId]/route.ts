import { currentProfile } from "@/lib/current-profile"
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(req: Request, { params }: { params: { memberId: string } }) {
    try {
        const profile = await currentProfile();
        if (!profile) {
            return new NextResponse("Unauthorized Access", { status: 401 })
        }

        const { searchParams } = new URL(req.url);
        const serverId = searchParams.get("serverId");

        if (!serverId) {
            return new NextResponse("Missing ServerID", { status: 400 })
        }
        if (!params.memberId) {
            return new NextResponse("Missing memberId", { status: 400 })
        }

        // First, verify that the current user is the server owner or has admin privileges
        const serverOwnership = await db.server.findFirst({
            where: {
                id: serverId,
                profileId: profile.id, // Current user must be the server owner
            }
        });

        if (!serverOwnership) {
            return new NextResponse("Only server owner can kick members", { status: 403 });
        }

        // Verify the member exists and is not the server owner
        const memberToKick = await db.member.findFirst({
            where: {
                id: params.memberId,
                serverId: serverId,
            },
            include: {
                profile: true
            }
        });

        if (!memberToKick) {
            return new NextResponse("Member not found", { status: 404 });
        }

        // Prevent kicking the server owner
        if (memberToKick.profileId === profile.id) {
            return new NextResponse("Cannot kick yourself", { status: 400 });
        }

        // Use a transaction to handle all deletions properly
        await db.$transaction(async (tx) => {
            // 1. Delete all conversations where this member is involved
            await tx.conversation.deleteMany({
                where: {
                    OR: [
                        { memberOneId: params.memberId },
                        { membertwoId: params.memberId }
                    ]
                }
            });

            // 2. Delete all direct messages sent by this member
            await tx.directMessage.deleteMany({
                where: {
                    memberId: params.memberId
                }
            });

            // 3. Delete all regular messages sent by this member
            await tx.message.deleteMany({
                where: {
                    memberId: params.memberId
                }
            });

            // 4. Finally, delete the member
            await tx.member.delete({
                where: {
                    id: params.memberId,
                }
            });
        });

        // Return updated server with members list
        const server = await db.server.findUnique({
            where: {
                id: serverId,
            },
            include: {
                member: {
                    include: {
                        profile: true
                    },
                    orderBy: {
                        role: "asc"
                    }
                }
            }
        });

        return NextResponse.json(server);

    } catch (error) {
        console.log("Error in KickMember", error);
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request, { params }: { params: { memberId: string } }) {
    try {
        const profile = await currentProfile();
        if (!profile) {
            return new NextResponse("Unauthorized Access", { status: 401 })
        }

        const { searchParams } = new URL(req.url);
        const { role } = await req.json();
        const serverId = searchParams.get("serverId");

        if (!serverId) {
            return new NextResponse("Missing serverId", { status: 400 })
        }
        if (!params.memberId) {
            return new NextResponse("Missing memberId", { status: 400 })
        }

        const server = await db.server.update({
            where: {
                id: serverId,
                profileId: profile.id, // Only server owner can change roles
            },
            data: {
                member: {
                    update: {
                        where: {
                            id: params.memberId,
                            profileId: { not: profile.id } // Cannot change own role
                        },
                        data: {
                            role
                        }
                    }
                }
            },
            include: {
                member: {
                    include: {
                        profile: true,
                    },
                    orderBy: {
                        role: "asc"
                    }
                }
            }
        })

        return NextResponse.json(server);

    } catch (error) {
        console.log("[ROLE_CHANGE ENDPOINT PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}