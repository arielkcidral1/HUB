import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ajuste o caminho conforme necessário

/**
 * Hook customizado para gerenciar operações CRUD de malotes
 * Fornece funções para listar, atualizar e gerenciar registros de malotes
 */
export function useMalotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [malotes, setMalotes] = useState([]);

  /**
   * Busca todos os registros de malotes do Supabase
   */
  const fetchMalotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(`Erro Supabase: ${supabaseError.message}`);
      }

      setMalotes(data || []);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao carregar malotes';
      setError(errorMessage);
      console.error('Erro ao buscar malotes:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca um malote específico por ID
   */
  const getMaloteById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .select('*')
        .eq('id', id)
        .single();

      if (supabaseError) {
        throw new Error(`Erro ao buscar malote: ${supabaseError.message}`);
      }

      return data;
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao buscar malote';
      setError(errorMessage);
      console.error('Erro ao buscar malote por ID:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza um registro de malote
   * IMPORTANTE: O campo 'updated_by' deve conter o nome do colaborador que recebe o EPI
   */
  const updateMalote = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      // Validações
      if (!updates.destino || !updates.destino.trim()) {
        throw new Error('Destino é obrigatório');
      }

      if (!updates.updated_by || !updates.updated_by.trim()) {
        throw new Error('Nome do colaborador que recebe o EPI é obrigatório');
      }

      // Preparar dados para atualização
      const dataToUpdate = {
        destino: updates.destino.trim(),
        status: updates.status || 'Separação',
        updated_by: updates.updated_by.trim(), // Nome do colaborador
        observacoes: updates.observacoes || '',
        epis: updates.epis || ''
      };

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .update(dataToUpdate)
        .eq('id', id)
        .select();

      if (supabaseError) {
        throw new Error(`Erro ao atualizar: ${supabaseError.message}`);
      }

      // Atualizar o array local
      setMalotes(prevMalotes =>
        prevMalotes.map(m => m.id === id ? { ...m, ...dataToUpdate } : m)
      );

      return data?.[0];
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao atualizar malote';
      setError(errorMessage);
      console.error('Erro ao atualizar malote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza especificamente o nome do colaborador que recebe o EPI
   */
  const updateColaborador = useCallback(async (id, nomColaborador) => {
    try {
      setLoading(true);
      setError(null);

      if (!nomColaborador || !nomColaborador.trim()) {
        throw new Error('Nome do colaborador é obrigatório');
      }

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .update({
          updated_by: nomColaborador.trim()
        })
        .eq('id', id)
        .select();

      if (supabaseError) {
        throw new Error(`Erro ao atualizar colaborador: ${supabaseError.message}`);
      }

      // Atualizar o array local
      setMalotes(prevMalotes =>
        prevMalotes.map(m =>
          m.id === id ? { ...m, updated_by: nomColaborador.trim() } : m
        )
      );

      return data?.[0];
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao atualizar colaborador';
      setError(errorMessage);
      console.error('Erro ao atualizar colaborador:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria um novo registro de malote
   */
  const createMalote = useCallback(async (maloteData) => {
    try {
      setLoading(true);
      setError(null);

      if (!maloteData.destino || !maloteData.destino.trim()) {
        throw new Error('Destino é obrigatório');
      }

      if (!maloteData.updated_by || !maloteData.updated_by.trim()) {
        throw new Error('Nome do colaborador é obrigatório');
      }

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .insert([{
          destino: maloteData.destino.trim(),
          epis: maloteData.epis || '',
          status: maloteData.status || 'Separação',
          updated_by: maloteData.updated_by.trim(),
          created_by: maloteData.created_by || 'Sistema',
          observacoes: maloteData.observacoes || '',
          origem: maloteData.origem || '',
          codigo_solicitacao: maloteData.codigo_solicitacao || null
        }])
        .select();

      if (supabaseError) {
        throw new Error(`Erro ao criar malote: ${supabaseError.message}`);
      }

      // Adicionar ao array local
      if (data && data.length > 0) {
        setMalotes(prevMalotes => [data[0], ...prevMalotes]);
      }

      return data?.[0];
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao criar malote';
      setError(errorMessage);
      console.error('Erro ao criar malote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deleta um registro de malote
   */
  const deleteMalote = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('hub_malotes')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw new Error(`Erro ao deletar malote: ${supabaseError.message}`);
      }

      // Remover do array local
      setMalotes(prevMalotes => prevMalotes.filter(m => m.id !== id));

      return true;
    } catch (err) {
      const errorMessage = err.message || 'Erro desconhecido ao deletar malote';
      setError(errorMessage);
      console.error('Erro ao deletar malote:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpa o estado de erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    malotes,
    loading,
    error,
    fetchMalotes,
    getMaloteById,
    updateMalote,
    updateColaborador,
    createMalote,
    deleteMalote,
    clearError
  };
}
