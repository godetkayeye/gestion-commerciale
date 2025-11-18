import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MANAGER_ASSIGNABLE_ROLES } from "@/lib/roles";

const allowed = new Set(["ADMIN", "MANAGER_MULTI"]);

const CreateSchema = z.object({
  nom: z.string().min(2),
  email: z.string().email(),
  mot_de_passe: z.string().min(6),
  role: z.enum(MANAGER_ASSIGNABLE_ROLES),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const users = await prisma.utilisateur.findMany({
    orderBy: { date_creation: "desc" },
    select: {
      id: true,
      nom: true,
      email: true,
      role: true,
      date_creation: true,
    },
  });

  return NextResponse.json({
    users: users
      .filter((user) => user.role !== "ADMIN")
      .map((user) => ({
        ...user,
        date_creation: user.date_creation?.toISOString() ?? null,
      })),
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !allowed.has(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 400 });
    }

    const exists = await prisma.utilisateur.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.mot_de_passe, 10);
    const user = await prisma.utilisateur.create({
      data: {
        nom: parsed.data.nom,
        email: parsed.data.email,
        mot_de_passe: hashedPassword,
        role: parsed.data.role as any,
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        date_creation: true,
      },
    });

    return NextResponse.json({
      user: {
        ...user,
        date_creation: user.date_creation?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error("[manager/users/POST]", error);
    return NextResponse.json({ error: "Erreur serveur", details: error.message }, { status: 500 });
  }
}

