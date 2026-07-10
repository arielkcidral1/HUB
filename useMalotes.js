import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useMalotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [malotes, setMalotes] = useState([]);

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

  const updateMalote = useCallback(async (id, updates) => {
    try {
      setLoading(true);
      setError(null);

      if (!updates.destino || !updates.destino.trim()) {
        throw new Error('Destino é obrigatório');
      }

      if (!updates.updated_by || !updates.updated_by.trim()) {
        throw new Error('Nome do colaborador que recebe o EPI é obrigatório');
      }

      const { data: maloteAtual, error: fetchError } = await supabase
        .from('hub_malotes')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar registro: ${fetchError.message}`);
      }

      const dataToUpdate = {
        destino: updates.destino?.trim() || maloteAtual.destino,
        epis: updates.epis || maloteAtual.epis,
        status: updates.status || maloteAtual.status,
        origem: maloteAtual.origem,
        observacoes: updates.observacoes || maloteAtual.observacoes,
        updated_by: updates.updated_by.trim(),
        created_by: maloteAtual.created_by,
        codigo_solicitacao: maloteAtual.codigo_solicitacao
      };

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .update(dataToUpdate)
        .eq('id', id)
        .select();

      if (supabaseError) {
        throw new Error(`Erro ao atualizar: ${supabaseError.message}`);
      }

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

  const updateColaborador = useCallback(async (id, nomColaborador) => {
    try {
      setLoading(true);
      setError(null);

      if (!nomColaborador || !nomColaborador.trim()) {
        throw new Error('Nome do colaborador é obrigatório');
      }

      const { data: maloteAtual, error: fetchError } = await supabase
        .from('hub_malotes')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`Erro ao buscar registro: ${fetchError.message}`);
      }

      const { data, error: supabaseError } = await supabase
        .from('hub_malotes')
        .update({
          destino: maloteAtual.destino,
          epis: maloteAtual.epis,
          status: maloteAtual.status,
          origem: maloteAtual.origem,
          observacoes: maloteAtual.observacoes,
          updated_by: nomColaborador.trim()
        })
        .eq('id', id)
        .select();

      if (supabaseError) {
        throw new Error(`Erro ao atualizar colaborador: ${supabaseError.message}`);
      }

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