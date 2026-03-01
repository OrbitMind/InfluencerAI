import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createLogger } from '@/lib/utils/logger';
import { PersonaService } from '@/lib/services/persona-service';
import { withAuth } from '@/lib/utils/auth';
import { createPersonaSchema, personaFiltersSchema } from '@/lib/validations/persona';

const logger = createLogger('personas');

const personaService = new PersonaService();

export const POST = withAuth(async (req, { userId }) => {
  logger.info('[POST /api/personas] Iniciando criação de persona');
  logger.info('[POST /api/personas] userId:', { userId });

  try {
    const body = await req.json();
    logger.info('[POST /api/personas] body recebido:', { body });

    const validated = createPersonaSchema.parse(body);
    logger.info('[POST /api/personas] Dados validados:', { validated });

    const persona = await personaService.createPersona(userId, validated);
    logger.info('[POST /api/personas] Persona criada:', {
      id: persona.id,
      name: persona.name,
      userId: persona.userId
    });

    return NextResponse.json({ success: true, data: persona }, { status: 201 });
  } catch (error: unknown) {
    logger.error('[POST /api/personas] Erro capturado:', { error });

    if (error instanceof z.ZodError) {
      logger.error('[POST /api/personas] Erro de validação Zod:', { errors: error.errors });
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao criar persona';
    logger.error('[POST /api/personas] Mensagem de erro:', { message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});

export const GET = withAuth(async (req, { userId }) => {
  logger.info('[GET /api/personas] Iniciando requisição');
  logger.info('[GET /api/personas] userId:', { userId });

  try {
    const { searchParams } = new URL(req.url);
    const params: Record<string, unknown> = {};

    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    logger.info('[GET /api/personas] searchParams:', { params });

    const filters = personaFiltersSchema.parse(params);
    logger.info('[GET /api/personas] Filtros validados:', { filters });

    const result = await personaService.listPersonas(userId, filters);
    logger.info('[GET /api/personas] Resultado:', {
      total: result.personas.length,
      pagination: result.pagination
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    logger.error('[GET /api/personas] Erro capturado:', { error });

    if (error instanceof z.ZodError) {
      logger.error('[GET /api/personas] Erro de validação Zod:', { errors: error.errors });
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Erro ao listar personas';
    logger.error('[GET /api/personas] Mensagem de erro:', { message });
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
});
