import { prisma } from '@/lib/db';
import { hash, compare } from 'bcryptjs';

/**
 * Repository para gerenciamento de Usuários
 * Data Access Layer - Camada de acesso a dados
 *
 * Princípios aplicados:
 * - Single Responsibility: Apenas operações de banco relacionadas a Usuários
 * - Separation of Concerns: Lógica de negócio fica nos Services
 */
export class UserRepository {
  /**
   * Cria um novo usuário com senha (para autenticação por credenciais)
   */
  async create(data: {
    name?: string;
    email: string;
    password: string;
  }) {
    const hashedPassword = await hash(data.password, 12);

    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true
        // Não retornar senha
      }
    });
  }

  /**
   * Busca usuário por email
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Busca usuário por ID
   */
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
        // Não retornar senha
      }
    });
  }

  /**
   * Verifica se a senha está correta
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);

    if (!user || !user.password) {
      return false;
    }

    return compare(password, user.password);
  }

  /**
   * Atualiza perfil do usuário
   */
  async update(id: string, data: {
    name?: string;
    image?: string;
  }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Atualiza a senha do usuário
   */
  async updatePassword(email: string, newPassword: string) {
    const hashedPassword = await hash(newPassword, 12);

    return prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
  }

  /**
   * Deleta usuário (cascata deletará api keys, sessions, etc.)
   */
  async delete(id: string) {
    return prisma.user.delete({
      where: { id }
    });
  }
}
