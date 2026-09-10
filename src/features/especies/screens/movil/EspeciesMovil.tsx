import { useRouter } from 'expo-router';
import { Plus, Shapes } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { useRefrescar } from '@/shared/hooks';
import { BotonIcono, Button, EstadoVacio, Modal, Pantalla, Text } from '@/shared/ui/atoms';
import { useTheme, type Theme } from '@/theme';

import { FilaEspecie, ModalEspecie } from '../../components';
import { useEspecies, useGuardarEspecie } from '../../hooks';
import type { Especie } from '../../types';

/**
 * Nombres para arrancar. La lista inicial de un negocio deberia ser un par de
 * toques y no una decision con la hoja en blanco.
 */
const SUGERENCIAS = [
  'Pantalón',
  'Pantalón corto',
  'Remera',
  'Zapatilla',
  'Media',
  'Campera',
] as const;

/** Fuera del componente: no depende de nada y asi no se recrea en cada render. */
const claveDeEspecie = (especie: Especie) => especie.id;

/**
 * Los tipos de mercaderia del negocio: Pantalon, Zapatilla, Media.
 *
 * Es lo unico que se carga ANTES de vender, y se carga una vez: el articulo
 * concreto se escribe en el ticket, en el momento. Sin especies no se puede
 * cargar un ticket, asi que es lo primero que ve un negocio recien dado de alta.
 */
export function EspeciesMovil() {
  const router = useRouter();
  const theme = useTheme();
  const styles = createStyles(theme);
  const lista = useEspecies();
  const guardar = useGuardarEspecie();
  const refresco = useRefrescar(lista.refrescar);

  const renderFila = useCallback(
    ({ item }: { item: Especie }) => (
      <FilaEspecie
        especie={item}
        onEditar={guardar.abrirEdicion}
        onAlternar={lista.alternarActivo}
        onBorrar={lista.pedirBorrado}
      />
    ),
    [guardar.abrirEdicion, lista.alternarActivo, lista.pedirBorrado],
  );

  const pendiente = lista.pendiente;
  const ofreceDesactivar = pendiente?.paso === 'enUso';

  return (
    <Pantalla
      titulo="Especies"
      descripcion={
        lista.especies.length > 0
          ? `${lista.especies.length} tipos de mercadería`
          : 'Los tipos de mercadería que vendés.'
      }
      ancho="contenido"
      onVolver={() => router.back()}
      labelVolver="Mas"
      accion={
        <BotonIcono accessibilityLabel="Nueva especie" onPress={() => guardar.abrirAlta()}>
          <Plus size={24} color={theme.colors.primary} strokeWidth={2} />
        </BotonIcono>
      }
    >
      {/* Los errores de prender/apagar y de borrar van arriba de la lista: no
          tienen una fila propia donde mostrarse. */}
      {lista.errorAccion ? (
        <Text variant="caption" tone="error" style={styles.aviso}>
          {lista.errorAccion}
        </Text>
      ) : null}

      {/*
        Son categorias, no productos. El aviso no bloquea nada: solo recuerda
        para que existe la lista, porque el dia que tenga sesenta especies las
        metricas no van a agrupar nada.
      */}
      {lista.listaLarga ? (
        <Text variant="caption" tone="warning" style={styles.aviso}>
          Son categorías, no artículos: el modelo y el talle se escriben en el ticket. Con la lista
          muy larga, las métricas dejan de agrupar.
        </Text>
      ) : null}

      {/* La primera carga tapa la lista; refrescar no, que para eso esta la
          rueda del gesto. */}
      {lista.cargando && !refresco.refrescando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={lista.especies}
          keyExtractor={claveDeEspecie}
          renderItem={renderFila}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={refresco.control}
          ListEmptyComponent={
            <EstadoVacio
              icono={<Shapes size={theme.typography.size.heading} color={theme.colors.textMuted} />}
              titulo={lista.error ? 'No pudimos traer las especies' : 'Todavía no hay especies'}
              descripcion={
                lista.error ??
                'Una especie es el tipo de mercadería: Pantalón, Zapatilla. Cargá las tuyas y vas a poder empezar a hacer tickets.'
              }
              accion={
                lista.error ? (
                  <Button label="Reintentar" variant="secondary" onPress={lista.reintentar} />
                ) : (
                  <View style={styles.sugerencias}>
                    {SUGERENCIAS.map((nombre) => (
                      <Button
                        key={nombre}
                        label={nombre}
                        variant="secondary"
                        size="sm"
                        onPress={() => guardar.abrirAlta(nombre)}
                      />
                    ))}
                  </View>
                )
              }
            />
          }
        />
      )}

      <ModalEspecie guardar={guardar} />

      {/*
        Un solo modal para los dos pasos del borrado. El 400 del backend no es
        un error para mostrar y olvidar: es la pregunta "¿la desactivo?", y
        encadenarla en el mismo modal la deja leerse como una conversacion en
        vez de como dos avisos sueltos.
      */}
      <Modal
        visible={pendiente !== null}
        onClose={lista.cancelarBorrado}
        titulo={ofreceDesactivar ? 'No se puede borrar' : `¿Borrar "${pendiente?.especie.nombre}"?`}
        descripcion={
          ofreceDesactivar
            ? // El mensaje del backend ya viene redactado y con el numero adentro.
              pendiente.mensaje
            : 'Solo se puede si no la usa ningún ticket.'
        }
        acciones={
          <>
            <Button label="Cancelar" variant="ghost" onPress={lista.cancelarBorrado} />
            <Button
              label={ofreceDesactivar ? 'Desactivar' : 'Borrar'}
              variant={ofreceDesactivar ? 'primary' : 'danger'}
              loading={lista.borrando}
              onPress={lista.confirmarBorrado}
            />
          </>
        }
      >
        {ofreceDesactivar ? (
          <Text variant="body" tone="muted">
            Desactivarla deja de ofrecerla al cargar un ticket. Lo que ya existe no cambia: los
            tickets viejos la siguen nombrando y las métricas de ese período se mantienen.
          </Text>
        ) : null}
      </Modal>
    </Pantalla>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // `flexGrow` deja el estado vacio centrado en vez de pegado arriba.
    lista: { flexGrow: 1, gap: theme.spacing.sm, paddingBottom: theme.spacing.lg },
    centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    aviso: { marginBottom: theme.spacing.sm },
    sugerencias: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      justifyContent: 'center',
    },
  });
