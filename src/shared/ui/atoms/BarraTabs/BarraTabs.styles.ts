import { StyleSheet } from 'react-native';

import { DIAMETRO_BURBUJA_TABS, type EstiloTabs, type Theme } from '@/theme';

export const createStyles = (theme: Theme, estilo: EstiloTabs, insetInferior: number) =>
  StyleSheet.create({
    // Envoltorio a todo el ancho. Pinta el fondo de la pantalla para que la
    // capsula del estilo flotante se apoye sobre algo y no sobre el vacio, y se
    // come el area segura de abajo (el gesto de home) para que la barra no
    // quede debajo de la rayita.
    envoltorio: {
      backgroundColor: theme.colors.background,
      paddingHorizontal: estilo.margenLateral,
      paddingBottom: estilo.margenInferior + insetInferior,
    },
    // La barra y la burbuja, sin padding propio: asi la posicion de la burbuja
    // se mide contra el borde de la barra y nada mas.
    pila: { position: 'relative' },
    // El aire de arriba donde asoma la burbuja. Va como View y no como padding
    // por la misma razon.
    aire: { height: estilo.margenSuperior },
    barra: {
      flexDirection: 'row',
      alignItems: 'center',
      height: estilo.alto,
      borderRadius: estilo.radio,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      // Despegada de los bordes, el contorno va por los cuatro lados; pegada al
      // piso, alcanza con la linea de arriba que la separa del contenido.
      ...(estilo.margenLateral > 0
        ? { borderWidth: StyleSheet.hairlineWidth }
        : { borderTopWidth: StyleSheet.hairlineWidth }),
    },
    // La sombra solo tiene sentido cuando la barra esta despegada del piso.
    flotando: {
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.16,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
    tab: {
      flex: 1,
      alignSelf: 'stretch',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    presionado: { opacity: 0.6 },
    // El icono del tab activo no se borra: se apaga y queda ocupando su lugar,
    // porque lo que se ve arriba en la burbuja es ese mismo icono. Si se
    // desmontara, la etiqueta saltaria de posicion.
    iconoLevantado: { opacity: 0 },
    burbuja: {
      position: 'absolute',
      left: 0,
      // Montada a caballo del borde de arriba de la barra: mitad adentro, mitad
      // en el aire reservado.
      bottom: estilo.alto - DIAMETRO_BURBUJA_TABS / 2,
      alignItems: 'center',
      justifyContent: 'center',
      width: DIAMETRO_BURBUJA_TABS,
      height: DIAMETRO_BURBUJA_TABS,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.primary,
      // El anillo del color del fondo corta la linea de la barra por detras de
      // la burbuja, para que se lea montada y no pegada.
      borderWidth: 4,
      borderColor: theme.colors.background,
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
    },
  });
